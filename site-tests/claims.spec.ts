import { test, expect } from "@playwright/test";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync as remove,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve } from "node:path";

const repo = process.cwd();
const binary = join(repo, "target/debug/diagnostic-packet");
const gitUrl = "https://github.com/B-Divyesh/sf-dev-diagnostic-packet.git";

function desktopOnly(projectName: string) {
  test.skip(projectName !== "desktop-chromium", "CLI claim runs once.");
}
function temp(prefix = "diagnostic-packet-claim-") {
  return mkdtempSync(join(tmpdir(), prefix));
}
function runResult(
  args: string[],
  cwd = repo,
  env: NodeJS.ProcessEnv = process.env,
) {
  return spawnSync(binary, args, { cwd, env, encoding: "utf8" });
}
function run(args: string[], cwd = repo, env: NodeJS.ProcessEnv = process.env) {
  const result = runResult(args, cwd, env);
  if (result.status !== 0)
    throw new Error(
      `${args.join(" ")} failed (${result.status}): ${result.stderr}`,
    );
  return result.stdout;
}
function sampleManifest() {
  return readFileSync(join(repo, "examples/diagnostic-packet.toml"), "utf8");
}
function seed(root: string, manifest = sampleManifest()) {
  mkdirSync(join(root, ".logs"), { recursive: true });
  writeFileSync(join(root, "diagnostic-packet.toml"), manifest);
  writeFileSync(
    join(root, ".logs/editor.log"),
    readFileSync(join(repo, "examples/editor.log")),
  );
  writeFileSync(
    join(root, "package-lock.json"),
    readFileSync(join(repo, "examples/package-lock.json")),
  );
}
function demo(env: NodeJS.ProcessEnv = process.env) {
  const output = run(["demo"], repo, env);
  const review = output.match(/Review folder: (.+)/)?.[1];
  const archive = output.match(/Packet ZIP: (.+)/)?.[1];
  if (!review || !archive)
    throw new Error(`Could not parse demo output: ${output}`);
  return { output, review, archive };
}
function sha(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}
function inventory(
  root: string,
  dir = root,
): Array<{ path: string; bytes: number; sha256: string }> {
  return readdirSync(dir)
    .flatMap((name) => {
      const path = join(dir, name);
      const rel = relative(root, path).replaceAll("\\", "/");
      if (rel === "inspection.json") return [];
      if (lstatSync(path).isDirectory()) return inventory(root, path);
      const bytes = readFileSync(path);
      return [{ path: rel, bytes: bytes.length, sha256: sha(bytes) }];
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}
function capture(root: string, review = join(root, "review")) {
  seed(root);
  run(
    ["capture", "--manifest", "diagnostic-packet.toml", "--output", review],
    root,
  );
  return review;
}
function buildAuditShim(root: string) {
  const shim = join(root, "audit.so");
  const result = spawnSync(
    "cc",
    [
      "-shared",
      "-fPIC",
      "-ldl",
      "-o",
      shim,
      join(repo, "site-tests/io_audit.c"),
    ],
    { encoding: "utf8" },
  );
  expect(result.status, result.stderr).toBe(0);
  return shim;
}

test("@claim:local-only denies sockets and audits demo writes", async ({}, info) => {
  desktopOnly(info.project.name);
  const root = temp("dp-local-audit-");
  const tmp = join(root, "tmp");
  mkdirSync(tmp);
  const audit = join(root, "audit.log");
  const result = demo({
    ...process.env,
    TMPDIR: tmp,
    DP_AUDIT_LOG: audit,
    LD_PRELOAD: buildAuditShim(root),
  });
  const lines = readFileSync(audit, "utf8").trim().split("\n");
  expect(lines.filter((line) => line.startsWith("NETWORK\t"))).toEqual([]);
  const writes = lines
    .filter((line) => line.startsWith("WRITE\t"))
    .map((line) => line.slice(6));
  expect(writes.length).toBeGreaterThan(0);
  expect(
    writes.every((path) => resolve(path).startsWith(resolve(tmp) + "/")),
  ).toBeTruthy();
  expect(result.review.startsWith(tmp)).toBeTruthy();
  remove(root, { recursive: true, force: true });
});

test("@claim:manifest-plan compares the complete plan with the manifest", async ({}, info) => {
  desktopOnly(info.project.name);
  const root = temp();
  seed(root);
  const preview = JSON.parse(
    run(["preview", "--manifest", "diagnostic-packet.toml", "--json"], root),
  );
  expect(preview).toEqual({
    valid: true,
    title: "Editor startup failure",
    collector_count: 4,
    requires_command_approval: false,
    collectors: [
      {
        id: "system",
        collector_type: "system",
        description: "OS family, architecture, and CLI version",
        runs_command: false,
      },
      {
        id: "editor-log",
        collector_type: "log",
        description: "redacted text from `.logs/editor.log` (max 200000 bytes)",
        runs_command: false,
      },
      {
        id: "lockfile",
        collector_type: "config-hash",
        description: "SHA-256 only for `package-lock.json`",
        runs_command: false,
      },
      {
        id: "environment",
        collector_type: "environment",
        description: "explicit environment names: CI, TERM, SHELL",
        runs_command: false,
      },
    ],
  });
  expect(existsSync(join(root, ".diagnostic-packet"))).toBeFalsy();
  remove(root, { recursive: true, force: true });
});

test("@claim:preview-read-only reads only its manifest and runs no child process", async ({}, info) => {
  desktopOnly(info.project.name);
  const root = temp();
  seed(root);
  const audit = join(root, "audit.log");
  run(["preview", "--manifest", "diagnostic-packet.toml"], root, {
    ...process.env,
    DP_AUDIT_LOG: audit,
    LD_PRELOAD: buildAuditShim(root),
  });
  const lines = readFileSync(audit, "utf8").trim().split("\n");
  expect(lines.filter((line) => line.startsWith("EXEC\t"))).toEqual([]);
  expect(lines.filter((line) => line.startsWith("WRITE\t"))).toEqual([]);
  const reads = lines
    .filter((line) => line.startsWith("READ\t"))
    .map((line) => basename(line.slice(5)));
  expect([...new Set(reads)]).toEqual(["diagnostic-packet.toml"]);
  expect(existsSync(join(root, ".diagnostic-packet"))).toBeFalsy();
  remove(root, { recursive: true, force: true });
});

test("@claim:command-approval covers approved, unapproved, unknown, and unsafe commands", async ({}, info) => {
  desktopOnly(info.project.name);
  const valid = sampleManifest().replace(
    /\[\[collectors\]\]\nid = "editor-log"[\s\S]*?max_bytes = 200000/,
    '[[collectors]]\nid = "node"\ntype = "tool-version"\ncommand = ["node", "--version"]',
  );
  const root = temp();
  seed(root, valid);
  expect(runResult(["--ci", "capture"], root).status).toBe(2);
  expect(
    runResult(["--ci", "capture", "--approve-commands"], root).status,
  ).toBe(0);
  for (const command of [
    '["curl", "--version"]',
    '["node", "--eval", "bad"]',
  ]) {
    const rejected = temp();
    seed(rejected, valid.replace('["node", "--version"]', command));
    expect(runResult(["preview"], rejected).status).toBe(2);
    remove(rejected, { recursive: true, force: true });
  }
  remove(root, { recursive: true, force: true });
});

test("@claim:redact-before-disk covers every advertised class and every output", async ({}, info) => {
  desktopOnly(info.project.name);
  const root = temp("dp-redact-audit-");
  seed(root);
  const audit = join(root, "audit.log");
  const review = join(root, "review");
  const archive = join(root, "packet.zip");
  const env = {
    ...process.env,
    DP_AUDIT_LOG: audit,
    LD_PRELOAD: buildAuditShim(root),
  };
  run(["capture", "--output", review], root, env);
  run(["inspect", review], root, env);
  run(["export", review, "--output", archive], root, env);
  expect(readFileSync(audit, "utf8")).not.toContain("RAW_WRITE");
  const disk =
    inventory(review)
      .map((f) => readFileSync(join(review, f.path), "utf8"))
      .join("\n") +
    execFileSync("unzip", ["-p", archive], { encoding: "utf8" });
  for (const value of [
    "dev@example.com",
    "sample-token-for-redaction",
    "10.0.0.1",
    "/home/dev/workspace",
  ])
    expect(disk).not.toContain(value);
  for (const value of [
    "[REDACTED_EMAIL]",
    "[REDACTED_SECRET]",
    "[REDACTED_IP]",
    "[HOME]",
  ])
    expect(disk).toContain(value);
  remove(root, { recursive: true, force: true });
});

test("@claim:config-hash-only independently verifies the SHA-256 and absent source bytes", async ({}, info) => {
  desktopOnly(info.project.name);
  const { review, archive } = demo();
  const report = JSON.parse(readFileSync(join(review, "report.json"), "utf8"));
  const item = report.evidence.find(
    (entry: { id: string }) => entry.id === "lockfile",
  );
  const source = readFileSync(join(repo, "examples/package-lock.json"));
  expect(item.sha256).toBe(sha(source));
  expect(item.bytes).toBe(source.length);
  expect(item.file).toBeUndefined();
  const output = inventory(review)
    .map((f) => readFileSync(join(review, f.path)))
    .concat(readFileSync(archive));
  expect(output.every((bytes) => !bytes.includes(source))).toBeTruthy();
});

test("@claim:manifest-boundaries covers supported and rejected boundaries", async ({}, info) => {
  desktopOnly(info.project.name);
  const root = temp();
  seed(root);
  const all =
    sampleManifest() +
    '\n[[collectors]]\nid="node"\ntype="tool-version"\ncommand=["node","--version"]\n';
  writeFileSync(join(root, "diagnostic-packet.toml"), all);
  expect(runResult(["preview"], root).status).toBe(0);
  const cases = [
    all.replace('type="tool-version"', 'type="unknown"'),
    sampleManifest().replace(".logs/editor.log", "/etc/passwd"),
    sampleManifest().replace(".logs/editor.log", "../outside.log"),
    all.replace('["node","--version"]', '["curl","--version"]'),
    all.replace('["node","--version"]', '["node","--eval"]'),
    sampleManifest().replace(
      'names = ["CI", "TERM", "SHELL"]',
      'names = ["API_TOKEN"]',
    ),
  ];
  const outside = `${root}-outside.log`;
  writeFileSync(outside, "outside");
  symlinkSync(outside, join(root, ".logs/link.log"));
  cases.push(sampleManifest().replace(".logs/editor.log", ".logs/link.log"));
  for (const manifest of cases.slice(0, -1)) {
    writeFileSync(join(root, "diagnostic-packet.toml"), manifest);
    expect(runResult(["preview"], root).status).toBe(2);
  }
  writeFileSync(join(root, "diagnostic-packet.toml"), cases.at(-1)!);
  expect(
    runResult(["capture", "--output", join(root, "symlink-review")], root)
      .status,
  ).toBe(2);
  remove(root, { recursive: true, force: true });
});

test("@claim:inspection-ledger matches every file, byte count, and SHA-256", async ({}, info) => {
  desktopOnly(info.project.name);
  const { review } = demo();
  const ledger = JSON.parse(
    readFileSync(join(review, "inspection.json"), "utf8"),
  );
  expect(ledger.files).toEqual(inventory(review));
  expect(ledger.total_bytes).toBe(
    ledger.files.reduce(
      (sum: number, file: { bytes: number }) => sum + file.bytes,
      0,
    ),
  );
});

test("@claim:inspection-required covers before, unchanged, and changed states", async ({}, info) => {
  desktopOnly(info.project.name);
  const root = temp();
  const review = capture(root);
  expect(
    runResult(["export", review, "--output", join(root, "before.zip")]).status,
  ).toBe(2);
  run(["inspect", review]);
  expect(
    runResult(["export", review, "--output", join(root, "clean.zip")]).status,
  ).toBe(0);
  writeFileSync(join(review, "report.json"), "changed");
  expect(
    runResult(["export", review, "--output", join(root, "changed.zip")]).status,
  ).toBe(2);
  remove(root, { recursive: true, force: true });
});

test("@claim:archive-contents exactly matches inspection and contains readable redacted files", async ({}, info) => {
  desktopOnly(info.project.name);
  const { review, archive } = demo();
  const ledger = JSON.parse(
    readFileSync(join(review, "inspection.json"), "utf8"),
  );
  const names = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" })
    .trim()
    .split("\n")
    .sort();
  expect(names).toEqual(
    [
      ...ledger.files.map((f: { path: string }) => f.path),
      "inspection.json",
    ].sort(),
  );
  for (const name of names)
    expect(execFileSync("unzip", ["-p", archive, name])).toEqual(
      readFileSync(join(review, name)),
    );
  expect(
    execFileSync("unzip", ["-p", archive, "report.html"], { encoding: "utf8" }),
  ).toMatch(/^<!doctype html>/);
  expect(
    names.every((name) =>
      /^(report\.(html|json)|inspection\.json|evidence\/[a-z0-9_-]+\.txt)$/.test(
        name,
      ),
    ),
  ).toBeTruthy();
});

test("@claim:cli-demo-isolation leaves launch data unchanged and uses only a fresh temp folder", async ({}, info) => {
  desktopOnly(info.project.name);
  const root = temp();
  const tmp = join(root, "tmp");
  const launch = join(root, "launch");
  mkdirSync(tmp);
  mkdirSync(launch);
  writeFileSync(join(launch, "keep.txt"), "unchanged");
  const before = inventory(launch);
  const output = run(["demo"], launch, { ...process.env, TMPDIR: tmp });
  const review = output.match(/Review folder: (.+)/)?.[1] ?? "";
  const archive = output.match(/Packet ZIP: (.+)/)?.[1] ?? "";
  expect(inventory(launch)).toEqual(before);
  expect(review.startsWith(join(tmp, "diagnostic-packet-demo-"))).toBeTruthy();
  expect(archive.startsWith(tmp)).toBeTruthy();
  remove(root, { recursive: true, force: true });
});

test("@claim:starter-manifest creates the documented checklist and refuses overwrite", async ({}, info) => {
  desktopOnly(info.project.name);
  const root = temp();
  expect(runResult(["init"], root).status).toBe(0);
  const manifest = readFileSync(join(root, "diagnostic-packet.toml"), "utf8");
  for (const field of [
    "format_version = 1",
    "[incident]",
    "[[collectors]]",
    'type = "system"',
    'type = "tool-version"',
  ])
    expect(manifest).toContain(field);
  expect(runResult(["init"], root).status).toBe(2);
  expect(readFileSync(join(root, "diagnostic-packet.toml"), "utf8")).toBe(
    manifest,
  );
  remove(root, { recursive: true, force: true });
});

test("@claim:log-truncation enforces max_bytes and still redacts", async ({}, info) => {
  desktopOnly(info.project.name);
  const root = temp();
  mkdirSync(join(root, ".logs"));
  writeFileSync(
    join(root, ".logs/log.txt"),
    "token=sample-token-for-redaction\n" + "x".repeat(200),
  );
  writeFileSync(
    join(root, "diagnostic-packet.toml"),
    sampleManifest()
      .replace(".logs/editor.log", ".logs/log.txt")
      .replace("max_bytes = 200000", "max_bytes = 80"),
  );
  writeFileSync(join(root, "package-lock.json"), "{}");
  const review = join(root, "review");
  run(["capture", "--output", review], root);
  const evidence = readFileSync(
    join(review, "evidence/editor-log.txt"),
    "utf8",
  );
  expect(Buffer.byteLength(evidence)).toBeLessThanOrEqual(80);
  expect(evidence).toContain("[REDACTED_SECRET]");
  expect(evidence).not.toContain("sample-token-for-redaction");
  remove(root, { recursive: true, force: true });
});

test("@claim:sensitive-env rejects secret-like names and accepts named safe values", async ({}, info) => {
  desktopOnly(info.project.name);
  const root = temp();
  seed(root);
  for (const name of ["API_TOKEN", "PASSWORD", "SESSION_ID", "PRIVATE_KEY"]) {
    writeFileSync(
      join(root, "diagnostic-packet.toml"),
      sampleManifest().replace(
        'names = ["CI", "TERM", "SHELL"]',
        `names = ["${name}"]`,
      ),
    );
    expect(runResult(["preview"], root).status).toBe(2);
  }
  writeFileSync(join(root, "diagnostic-packet.toml"), sampleManifest());
  expect(runResult(["preview"], root).status).toBe(0);
  remove(root, { recursive: true, force: true });
});

test("@claim:demo-sandbox resets and exits without touching real storage", async ({
  page,
}) => {
  await page.goto("/?demo=1#demo");
  await page.evaluate(() =>
    localStorage.setItem("real:user-setting", "keep-me"),
  );
  await expect(page.getByLabel("Demo mode")).toContainText(
    "sample data, nothing is saved",
  );
  await page.getByRole("tab", { name: /Capture/ }).click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("demo:diagnostic-packet:stage"),
    ),
  ).toBe("capture");
  await page.getByRole("button", { name: "Reset demo" }).click();
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("demo:diagnostic-packet:"),
      ),
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(() => localStorage.getItem("real:user-setting")),
  ).toBe("keep-me");
  await page.getByRole("tab", { name: /Inspect/ }).click();
  await page.getByRole("link", { name: "Install the CLI" }).click();
  await expect(page).toHaveURL(/\/#install$/);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("demo:diagnostic-packet:"),
      ),
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(() => localStorage.getItem("real:user-setting")),
  ).toBe("keep-me");
});

test("@claim:free-source-install installs the exact public command and verifies MIT", async ({}, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(300_000);
  const root = temp("dp-public-install-");
  const result = spawnSync(
    "cargo",
    ["install", "--git", gitUrl, "--root", root, "--locked"],
    { encoding: "utf8", timeout: 280_000 },
  );
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  const installed = join(root, "bin/diagnostic-packet");
  expect(
    spawnSync(installed, ["--version"], { encoding: "utf8" }).stdout,
  ).toMatch(/^diagnostic-packet 0\.1\./);
  expect(
    spawnSync(installed, ["demo"], { cwd: root, encoding: "utf8" }).status,
  ).toBe(0);
  expect(readFileSync(join(repo, "LICENSE"), "utf8")).toContain(
    "Permission is hereby granted, free of charge",
  );
  expect(readFileSync(join(repo, "Cargo.toml"), "utf8")).toContain(
    'license = "MIT"',
  );
  remove(root, { recursive: true, force: true });
});

test("@claim:cli-contract verifies every help, JSON workflow, CI mode, and exit code", async ({}, info) => {
  desktopOnly(info.project.name);
  for (const command of [
    [],
    ["init"],
    ["demo"],
    ["preview"],
    ["capture"],
    ["inspect"],
    ["export"],
  ])
    expect(runResult([...command, "--help"]).status).toBe(0);
  const root = temp();
  run(["init"], root);
  expect(JSON.parse(run(["preview", "--json"], root)).valid).toBe(true);
  expect(runResult(["--ci", "capture"], root).status).toBe(2);
  expect(
    JSON.parse(run(["--ci", "capture", "--approve-commands", "--json"], root))
      .status,
  ).toBe("captured");
  expect(
    JSON.parse(run(["inspect", "--json"], root)).files.length,
  ).toBeGreaterThan(1);
  expect(JSON.parse(run(["export", "--json"], root)).status).toBe("exported");
  expect(
    runResult(["preview", "--manifest", "missing.toml"], root).status,
  ).toBe(1);
  expect(runResult(["preview", "--manifest", "/etc/passwd"], root).status).toBe(
    2,
  );
  remove(root, { recursive: true, force: true });
});

test("@claim:clean-build creates exact outputs from a clean checkout", async ({}, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(300_000);
  const root = temp("dp-clean-build-");
  expect(
    spawnSync("git", ["clone", "--local", "--no-hardlinks", repo, root], {
      encoding: "utf8",
    }).status,
  ).toBe(0);
  remove(join(root, "dist"), { recursive: true, force: true });
  remove(join(root, "target"), { recursive: true, force: true });
  const install = spawnSync("npm", ["ci"], {
    cwd: root,
    encoding: "utf8",
    timeout: 280_000,
  });
  expect(install.status, `${install.stdout}\n${install.stderr}`).toBe(0);
  const result = spawnSync("npm", ["run", "build"], {
    cwd: root,
    encoding: "utf8",
    timeout: 280_000,
  });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  expect(existsSync(join(root, "dist/diagnostic-packet"))).toBeTruthy();
  expect(existsSync(join(root, "dist/site/index.html"))).toBeTruthy();
  remove(root, { recursive: true, force: true });
});

test("@claim:site-private audits the full demo for tracking, accounts, cookies, and scripts", async ({
  page,
}) => {
  const urls: string[] = [];
  page.on("request", (request) => urls.push(request.url()));
  await page.goto("/?demo=1#demo");
  await page.getByRole("tab", { name: /Capture/ }).click();
  await page.getByRole("tab", { name: /Inspect/ }).click();
  await page.getByRole("tab", { name: /Export/ }).click();
  await page.waitForLoadState("networkidle");
  expect(urls.length).toBeGreaterThan(0);
  expect(
    urls.every((url) => new URL(url).origin === "http://127.0.0.1:4173"),
  ).toBeTruthy();
  expect(
    urls.some((url) => /analytics|telemetry|pixel|segment|sentry/i.test(url)),
  ).toBeFalsy();
  expect(await page.context().cookies()).toEqual([]);
  expect(
    await page
      .locator("script[src]")
      .evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            new URL((node as HTMLScriptElement).src).origin === location.origin,
        ),
      ),
  ).toBeTruthy();
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).every((key) =>
        key.startsWith("demo:diagnostic-packet:"),
      ),
    ),
  ).toBeTruthy();
  await expect(page.getByText(/sign in|log in|create account/i)).toHaveCount(0);
});

test("@claim:clear-cache uses browser site-data clearing", async ({ page }) => {
  await page.goto("/demo/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    localStorage.setItem("demo:diagnostic-packet:test", "value");
  });
  expect(
    (await page.evaluate(async () => caches.keys())).length,
  ).toBeGreaterThan(0);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Storage.clearDataForOrigin", {
    origin: "http://127.0.0.1:4173",
    storageTypes: "all",
  });
  expect(
    await page.evaluate(async () => ({
      caches: await caches.keys(),
      keys: Object.keys(localStorage),
      registrations: (await navigator.serviceWorker.getRegistrations()).length,
    })),
  ).toEqual({ caches: [], keys: [], registrations: 0 });
});

test("@claim:demo-keyboard changes stages with arrow, Home, and End", async ({
  page,
}) => {
  await page.goto("/demo/");
  const preview = page.getByRole("tab", { name: /Preview/ });
  await preview.focus();
  await preview.press("End");
  await expect(page.getByRole("tab", { name: /Export/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("tab", { name: /Export/ }).press("Home");
  await expect(preview).toHaveAttribute("aria-selected", "true");
  await preview.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Capture/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("tab", { name: /Capture/ }).press("ArrowLeft");
  await expect(preview).toHaveAttribute("aria-selected", "true");
});

test("@claim:routes-and-404 verifies route titles and complete metadata", async ({
  page,
}) => {
  const routes = [
    ["/", "Diagnostic Packet — Collect and redact bug evidence"],
    ["/demo/", "Demo — Diagnostic Packet"],
    ["/privacy/", "Privacy — Diagnostic Packet"],
    ["/terms/", "Terms — Diagnostic Packet"],
    ["/404.html", "Page not found — Diagnostic Packet"],
  ] as const;
  for (const [route, title] of routes) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    await expect(page.locator("h1")).toHaveCount(1);
    for (const selector of [
      'link[rel="canonical"]',
      'link[rel="icon"]',
      'link[rel="apple-touch-icon"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:image"]',
      'meta[property="og:url"]',
      'meta[name="twitter:card"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:description"]',
      'meta[name="twitter:image"]',
    ])
      await expect(page.locator(selector)).toHaveCount(1);
  }
  await page.goto("/404.html");
  await expect(page.locator("h1")).toContainText("not in the packet");
});

test("@claim:download-starter downloads a parseable checklist", async ({
  page,
}) => {
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter manifest" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("diagnostic-packet.toml");
  const path = await download.path();
  expect(path).not.toBeNull();
  const text = readFileSync(path!, "utf8");
  for (const field of [
    "format_version = 1",
    "[incident]",
    "[[collectors]]",
    'type = "system"',
  ])
    expect(text).toContain(field);
});

test("@claim:cli-demo-recording matches output from the real binary", async ({
  page,
}, info) => {
  desktopOnly(info.project.name);
  const real = run(["demo"]);
  const cast = readFileSync(
    join(repo, "site/public/assets/diagnostic-packet-demo.cast"),
    "utf8",
  );
  expect(cast).toContain("Demo packet created from bundled sample data.");
  expect(cast).toContain("Redacted 4 sensitive value(s); exported 6 file(s)");
  expect(real).toContain("Demo packet created from bundled sample data.");
  await page.goto("/?demo=1#demo");
  await expect(
    page.getByLabel("Transcript recorded from diagnostic-packet demo"),
  ).toContainText("Demo packet created from bundled sample data.");
});
