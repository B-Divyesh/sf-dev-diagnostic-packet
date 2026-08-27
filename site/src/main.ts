type Stage = 'preview' | 'capture' | 'inspect' | 'export';

const stages: Stage[] = ['preview', 'capture', 'inspect', 'export'];
const stageContent: Record<Stage, { label: string; status: string; rows: string; next: string }> = {
  preview: {
    label: 'Collection plan', status: 'No data read', next: 'Approve and capture',
    rows: '<p class="terminal-line ok"><b>VALID</b> 4 collectors</p><p class="ledger"><span>system</span><span>ready</span></p><p class="ledger"><span>node --version</span><span>approval</span></p><p class="ledger"><span>package-lock.json</span><span>hash only</span></p><p class="ledger"><span>.logs/editor.log</span><span>redact</span></p><p class="terminal-note">Preview completed. Nothing was collected or executed.</p>'
  },
  capture: {
    label: 'Local capture', status: '2 values redacted', next: 'Inspect staged files',
    rows: '<p class="terminal-line"><b>CAPTURED</b> system.txt</p><p class="terminal-line"><b>CAPTURED</b> node.txt</p><p class="terminal-line"><b>HASHED</b> package-lock.json</p><p class="terminal-line"><b>REDACTED</b> editor.log</p><pre class="log-sample">user=<mark>[REDACTED_EMAIL]</mark>\nhost=<mark>[REDACTED_IP]</mark>\nerror=extension host exited 1</pre>'
  },
  inspect: {
    label: 'Inspection ledger', status: '4 files reviewed', next: 'Export packet ZIP',
    rows: '<p class="ledger header"><span>File</span><span>SHA-256</span></p><p class="ledger"><span>report.html</span><span>8d4e…0ab2</span></p><p class="ledger"><span>report.json</span><span>b12f…7c31</span></p><p class="ledger"><span>system.txt</span><span>22ca…19b0</span></p><p class="ledger"><span>editor-log.txt</span><span>74e1…cd18</span></p><p class="terminal-note">Inspection marker written. Any later change blocks export.</p>'
  },
  export: {
    label: 'Sealed packet', status: 'Ready to share', next: 'Start again',
    rows: '<div class="packet-result" aria-label="Export complete"><span class="packet-icon" aria-hidden="true">ZIP</span><div><b>editor-startup-failure.zip</b><small>5 inspected files · 18.4 KB</small></div></div><p class="terminal-line ok"><b>EXPORTED</b> Exact inspected contents</p><p class="terminal-note">Includes readable report.html. No executable content. No upload performed.</p>'
  }
};

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
const output = document.querySelector<HTMLElement>('#demo-output');
const label = document.querySelector<HTMLElement>('#demo-state-label');
const status = document.querySelector<HTMLElement>('#demo-status');
const panel = document.querySelector<HTMLElement>('#demo-panel');
const next = document.querySelector<HTMLButtonElement>('#next-stage');
const unsafe = document.querySelector<HTMLButtonElement>('#unsafe-demo');
let current: Stage = 'preview';

function showStage(stage: Stage, focus = false) {
  current = stage;
  const content = stageContent[stage];
  if (output) output.innerHTML = content.rows;
  if (label) label.textContent = content.label;
  if (status) status.textContent = content.status;
  if (next) next.textContent = content.next;
  tabs.forEach((tab) => {
    const selected = tab.dataset.stage === stage;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected) {
      panel?.setAttribute('aria-labelledby', tab.id);
      if (focus) tab.focus();
    }
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => showStage(tab.dataset.stage as Stage));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let target = index;
    if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = tabs.length - 1;
    showStage(tabs[target].dataset.stage as Stage, true);
  });
});

next?.addEventListener('click', () => {
  const index = stages.indexOf(current);
  showStage(stages[(index + 1) % stages.length]);
});

unsafe?.addEventListener('click', () => {
  if (label) label.textContent = 'Manifest blocked';
  if (status) status.textContent = 'Unsafe path rejected';
  if (output) output.innerHTML = '<div class="error-state" role="alert"><b>Could not preview this manifest.</b><p>Path <code>../private.env</code> leaves the project directory.</p><p>Use a relative path inside the manifest folder, then preview again.</p></div>';
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
  button.addEventListener('click', async () => {
    const source = document.getElementById(button.dataset.copy ?? '');
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source.textContent ?? '');
      const original = button.textContent;
      button.textContent = 'Copied';
      window.setTimeout(() => { button.textContent = original; }, 1800);
    } catch {
      button.textContent = 'Select and copy';
      const range = document.createRange();
      range.selectNodeContents(source);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  });
}

document.querySelector<HTMLButtonElement>('#download-manifest')?.addEventListener('click', () => {
  const content = `format_version = 1\ntitle = "Describe this incident"\n\n[incident]\nsummary = "What failed?"\nexpected = "What should have happened?"\nactual = "What happened instead?"\nsteps = ["Add the exact reproduction steps"]\n\n[[collectors]]\nid = "system"\ntype = "system"\n`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'diagnostic-packet.toml';
  link.click();
  URL.revokeObjectURL(url);
});

function updateNetworkState() {
  const node = document.querySelector<HTMLElement>('#network-state');
  if (!node) return;
  node.textContent = navigator.onLine ? 'Works offline after first visit' : 'Offline · docs and demo remain available';
}
window.addEventListener('online', updateNetworkState);
window.addEventListener('offline', updateNetworkState);
updateNetworkState();

showStage('preview');
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
