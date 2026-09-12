const panel = document.createElement('section');
panel.className = 'method';
panel.setAttribute('aria-label', 'Ootle research record');
panel.innerHTML = `<h2>Research anchored on Ootle</h2><p>Esmeralda testnet · Immutable research edition</p><p>The published record stores this edition’s SHA-256 fingerprint and research link. Live price refreshes are separate. A matching fingerprint proves file integrity, not research accuracy.</p><details><summary>View record & verify edition</summary><dl id="proofFacts"></dl><p><a href="data/research-snapshot.json" download>Download research edition</a> · <a href="data/ootle-deployment.json">Deployment details</a></p><button id="verifyEdition">Verify saved edition</button><p id="proofStatus" role="status">Deployment evidence: accepted wallet receipt supplied by the publisher; no live network check has been performed here.</p></details>`;
document.querySelector('.stats').after(panel);
const button = panel.querySelector('button');
const status = panel.querySelector('#proofStatus');
let record;
button.disabled = true;
try {
  const response = await fetch('data/ootle-deployment.json');
  if (!response.ok) throw Error('Deployment details unavailable');
  record = await response.json();
  for (const [label, value] of [['Component', record.componentAddress], ['Transaction', record.transactionId], ['SHA-256', record.researchSha256]]) {
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = value; dd.style.overflowWrap = 'anywhere';
    panel.querySelector('dl').append(dt, dd);
  }
  button.disabled = false;
} catch { status.textContent = 'Deployment details could not be loaded. Reload to try again.'; }
button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Checking the saved research file…';
  try {
    const response = await fetch('data/research-snapshot.json', {cache: 'no-store'});
    if (!response.ok) throw Error('Research download failed');
    const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
    const hex = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    status.textContent = hex === record.researchSha256
      ? 'Match: this saved edition matches the fingerprint in the accepted deployment receipt. This is a file integrity check, not a live network query.'
      : 'Mismatch: this file does not match the recorded edition. Do not treat it as the anchored research.';
  } catch { status.textContent = 'Verification unavailable. Retry when the research file and browser cryptography are available.'; }
  finally { button.disabled = false; }
});
