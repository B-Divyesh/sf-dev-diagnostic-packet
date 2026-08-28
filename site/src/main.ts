type Stage = "preview" | "capture" | "inspect" | "export";

const stages: Stage[] = ["preview", "capture", "inspect", "export"];
const stageContent: Record<
  Stage,
  { label: string; status: string; rows: string; next: string }
> = {
  preview: {
    label: "Collection plan",
    status: "No data read",
    next: "Capture sample",
    rows: '<p class="terminal-line ok"><b>VALID</b> 4 collection items</p><p class="ledger"><span>system</span><span>ready</span></p><p class="ledger"><span>editor.log</span><span>redact</span></p><p class="ledger"><span>package-lock.json</span><span>hash only</span></p><p class="ledger"><span>CI, TERM</span><span>named values</span></p><p class="terminal-note">Preview completed. Nothing was collected or executed.</p>',
  },
  capture: {
    label: "Local capture",
    status: "4 values redacted",
    next: "Inspect review files",
    rows: '<p class="terminal-line"><b>CAPTURED</b> system.txt</p><p class="terminal-line"><b>CAPTURED</b> node.txt</p><p class="terminal-line"><b>HASHED</b> package-lock.json</p><p class="terminal-line"><b>REDACTED</b> editor.log</p><pre class="log-sample">user=<mark>[REDACTED_EMAIL]</mark>\nhost=<mark>[REDACTED_IP]</mark>\nerror=extension host exited 1</pre>',
  },
  inspect: {
    label: "Inspection ledger",
    status: "4 files reviewed",
    next: "Export packet ZIP",
    rows: '<p class="ledger header"><span>File</span><span>SHA-256</span></p><p class="ledger"><span>report.html</span><span>8d4e…0ab2</span></p><p class="ledger"><span>report.json</span><span>b12f…7c31</span></p><p class="ledger"><span>system.txt</span><span>22ca…19b0</span></p><p class="ledger"><span>editor-log.txt</span><span>74e1…cd18</span></p><p class="terminal-note">Inspection marker written. Any later change blocks export.</p>',
  },
  export: {
    label: "Packet ZIP",
    status: "Ready to share",
    next: "Reset demo",
    rows: '<div class="packet-result" aria-label="Export complete"><span class="packet-icon" aria-hidden="true">ZIP</span><div><b>editor-startup-failure.zip</b><small>5 inspected files · 18.4 KB</small></div></div><p class="terminal-line ok"><b>EXPORTED</b> Inspected files</p><p class="terminal-note">Includes readable report.html. No executable content. No upload performed.</p>',
  },
};

const tabs = Array.from(
  document.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
);
const output = document.querySelector<HTMLElement>("#demo-output");
const label = document.querySelector<HTMLElement>("#demo-state-label");
const status = document.querySelector<HTMLElement>("#demo-status");
const panel = document.querySelector<HTMLElement>("#demo-panel");
const next = document.querySelector<HTMLButtonElement>("#next-stage");
const unsafe = document.querySelector<HTMLButtonElement>("#unsafe-demo");
let current: Stage = "preview";
const demoMode =
  document.body.dataset.demo === "true" ||
  new URLSearchParams(location.search).get("demo") === "1";
const demoKey = "demo:diagnostic-packet:stage";

function showStage(stage: Stage, focus = false, persist = true) {
  current = stage;
  const content = stageContent[stage];
  if (output) output.innerHTML = content.rows;
  if (label) label.textContent = content.label;
  if (status) status.textContent = content.status;
  if (next) next.textContent = content.next;
  tabs.forEach((tab) => {
    const selected = tab.dataset.stage === stage;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected) {
      panel?.setAttribute("aria-labelledby", tab.id);
      if (focus) tab.focus();
    }
  });
  if (demoMode && persist) localStorage.setItem(demoKey, stage);
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => showStage(tab.dataset.stage as Stage));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let target = index;
    if (event.key === "ArrowRight") target = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      target = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") target = 0;
    if (event.key === "End") target = tabs.length - 1;
    showStage(tabs[target].dataset.stage as Stage, true);
  });
});

next?.addEventListener("click", () => {
  const index = stages.indexOf(current);
  if (current === "export") resetDemo();
  else showStage(stages[index + 1]);
});

unsafe?.addEventListener("click", () => {
  if (label) label.textContent = "Manifest blocked";
  if (status) status.textContent = "Unsafe path rejected";
  if (output)
    output.innerHTML =
      '<div class="error-state" role="alert"><b>Could not preview this manifest.</b><p>Path <code>../private.env</code> leaves the project directory.</p><p>Use a relative path inside the manifest folder, then preview again.</p></div>';
});

for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-copy]",
)) {
  button.addEventListener("click", async () => {
    const source = document.getElementById(button.dataset.copy ?? "");
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source.textContent ?? "");
      const original = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = original;
      }, 1800);
    } catch {
      button.textContent = "Select and copy";
      const range = document.createRange();
      range.selectNodeContents(source);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  });
}

document
  .querySelector<HTMLButtonElement>("#download-manifest")
  ?.addEventListener("click", () => {
    const content = `format_version = 1\ntitle = "Describe this incident"\n\n[incident]\nsummary = "What failed?"\nexpected = "What should have happened?"\nactual = "What happened instead?"\nsteps = ["Add the exact reproduction steps"]\n\n[[collectors]]\nid = "system"\ntype = "system"\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "diagnostic-packet.toml";
    link.click();
    URL.revokeObjectURL(url);
  });

function resetDemo() {
  clearDemoStorage();
  showStage("preview", false, false);
  const status = document.querySelector<HTMLElement>("#route-announcement");
  if (status) status.textContent = "Demo reset. The sample packet is ready.";
}

function clearDemoStorage() {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("demo:diagnostic-packet:"))
      localStorage.removeItem(key);
  }
}

function enableDemo() {
  if (!demoMode) return;
  document.body.classList.add("demo-active");
  const banner = document.createElement("aside");
  banner.className = "demo-banner";
  banner.setAttribute("aria-label", "Demo mode");
  banner.innerHTML =
    '<span><b>Demo</b> — sample data, nothing is saved to your project.</span><div><button type="button" class="demo-reset">Reset demo</button><a class="demo-exit" href="/#install">Install the CLI</a></div>';
  document.body.prepend(banner);
  banner
    .querySelector<HTMLButtonElement>(".demo-reset")
    ?.addEventListener("click", resetDemo);
  banner
    .querySelector<HTMLAnchorElement>(".demo-exit")
    ?.addEventListener("click", clearDemoStorage);
  const saved = localStorage.getItem(demoKey) as Stage | null;
  if (saved && stages.includes(saved)) showStage(saved);
}

function enhanceInternalNavigation() {
  document
    .querySelectorAll<HTMLAnchorElement>('a[href^="/"]')
    .forEach((link) => {
      link.addEventListener("click", () => {
        const announcement = document.querySelector<HTMLElement>(
          "#route-announcement",
        );
        if (announcement)
          announcement.textContent = `Opening ${link.textContent?.trim() ?? "page"}.`;
      });
    });
  window.addEventListener("pageshow", () => {
    const heading = document.querySelector<HTMLElement>('h1[tabindex="-1"]');
    if (
      heading &&
      performance
        .getEntriesByType("navigation")
        .some(
          (entry) =>
            (entry as PerformanceNavigationTiming).type === "back_forward",
        )
    )
      heading.focus();
  });
  try {
    if (
      document.referrer &&
      new URL(document.referrer).origin === location.origin
    ) {
      const heading = document.querySelector<HTMLElement>('h1[tabindex="-1"]');
      const announcement = document.querySelector<HTMLElement>(
        "#route-announcement",
      );
      heading?.focus();
      if (announcement && heading)
        announcement.textContent = heading.textContent?.trim() ?? "";
    }
  } catch {
    /* A malformed referrer must not affect navigation. */
  }
}

function updateNetworkState() {
  const node = document.querySelector<HTMLElement>("#network-state");
  if (!node) return;
  node.textContent = navigator.onLine
    ? "Works offline after first visit"
    : "Offline · docs and demo remain available";
}
window.addEventListener("online", updateNetworkState);
window.addEventListener("offline", updateNetworkState);
updateNetworkState();

showStage("preview");
enableDemo();
enhanceInternalNavigation();
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("/sw.js").catch(() => undefined),
  );
}
