const panel = document.createElement('section');
panel.className = 'method';
panel.setAttribute('aria-label', 'Ootle research record');
panel.innerHTML = `<h2>Ootle research record</h2><p>Esmeralda testnet · Historical edition</p><p>This record identifies an earlier research edition, not the current website. The original artifact is retained in the project’s source history; its download and verification are no longer offered here. A fingerprint establishes file integrity, not research accuracy.</p><details><summary>View historical record</summary><dl id="proofFacts"></dl><p id="proofStatus" role="status">Deployment evidence: accepted wallet receipt supplied by the publisher; no live network check has been performed here.</p></details>`;
document.querySelector('.stats').after(panel);
const status = panel.querySelector('#proofStatus');
let record;
try {
  const response = await fetch('data/ootle-deployment.json');
  if (!response.ok) throw Error('Deployment details unavailable');
  record = await response.json();
  for (const [label, value] of [['Component', record.componentAddress], ['Transaction', record.transactionId], ['SHA-256', record.researchSha256]]) {
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = value; dd.style.overflowWrap = 'anywhere';
    panel.querySelector('dl').append(dt, dd);
  }
} catch { status.textContent = 'Deployment details could not be loaded. Reload to try again.'; }
