// Deliberately do not persist acceptance: every page load requires acknowledgment.
export function initDisclosure(doc, startApp) {
  const gate = doc.getElementById('disclosureGate');
  const site = doc.getElementById('siteContent');
  const form = doc.getElementById('disclosureForm');
  const check = doc.getElementById('disclosureCheck');
  const button = doc.getElementById('disclosureContinue');
  const error = doc.getElementById('disclosureError');
  let started = false;
  let loading = false;
  const sync = () => { button.disabled = !check.checked || loading; };
  const open = () => {
    site.hidden = true;
    site.inert = true;
    gate.hidden = false;
    check.checked = false;
    error.hidden = true;
    sync();
    doc.getElementById('disclosureTitle').focus();
  };
  check.addEventListener('change', sync);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!check.checked || loading) return;
    loading = true;
    sync();
    error.hidden = true;
    button.textContent = 'Opening research…';
    try {
      if (!started) { await startApp(); started = true; }
      // Recheck in case the checkbox changed while the modules loaded.
      if (!check.checked) return;
      gate.hidden = true;
      site.hidden = false;
      site.inert = false;
      site.querySelector('.brand').focus();
    } catch {
      error.textContent = 'The research could not load. Check your connection and try again.';
      error.hidden = false;
    } finally {
      loading = false;
      button.textContent = 'Continue to Privacy Atlas';
      sync();
    }
  });
  doc.querySelectorAll('[data-open-disclosure]').forEach(link => link.addEventListener('click', open));
  // Reset a browser-restored form and acknowledgment, including back/forward cache.
  doc.defaultView?.addEventListener('pageshow', open);
  open();
}
