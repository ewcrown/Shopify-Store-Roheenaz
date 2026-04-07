/**
 * Collection countdown — date (YYYY-MM-DD) + time (HH:MM:SS), or data-end-unix from metafield.
 * Displays days : hours : minutes : seconds (2-digit padding where appropriate).
 */

function pad2(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function formatDays(days) {
  const d = Math.max(0, Math.floor(days));
  return d < 100 ? pad2(d) : String(d);
}

function parseHmsOnDate(dateStr, hms) {
  if (!dateStr || !hms || typeof hms !== 'string') return NaN;
  const segs = hms.trim().split(':');
  if (segs.length < 2) return NaN;
  const hh = parseInt(segs[0], 10);
  const mm = parseInt(segs[1], 10);
  const ss = segs[2] !== undefined && segs[2] !== '' ? parseInt(segs[2], 10) : 0;
  if ([hh, mm, ss].some((n) => Number.isNaN(n))) return NaN;
  const parts = dateStr.split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3) return NaN;
  const [y, mo, d] = parts;
  return new Date(y, mo - 1, d, hh, mm, ss).getTime();
}

function setDashes(dEl, hEl, mEl, sEl) {
  const dash = '—';
  dEl.textContent = dash;
  hEl.textContent = dash;
  mEl.textContent = dash;
  sEl.textContent = dash;
}

function setDhms(diffSec, dEl, hEl, mEl, sEl) {
  const days = Math.floor(diffSec / 86400);
  const h = Math.floor((diffSec % 86400) / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  dEl.textContent = formatDays(days);
  hEl.textContent = pad2(h);
  mEl.textContent = pad2(m);
  sEl.textContent = pad2(s);
}

function setEnded(dEl, hEl, mEl, sEl) {
  dEl.textContent = '00';
  hEl.textContent = '00';
  mEl.textContent = '00';
  sEl.textContent = '00';
}

function tick(root) {
  const merchantDate = root.dataset.merchantDate || '';
  const endUnix = root.dataset.endUnix || '';
  const endDate = root.dataset.endDate || '';
  const endHms = root.dataset.endHms || '';
  const startDate = root.dataset.startDate || '';
  const startHms = root.dataset.startHms || '';

  const dEl = root.querySelector('[data-ew-countdown-days]');
  const hEl = root.querySelector('[data-ew-countdown-hours]');
  const mEl = root.querySelector('[data-ew-countdown-mins]');
  const sEl = root.querySelector('[data-ew-countdown-secs]');
  const phaseEl = root.querySelector('[data-ew-countdown-phase]');

  if (!dEl || !hEl || !mEl || !sEl) return;

  let endMs = NaN;
  if (endUnix && !Number.isNaN(Number(endUnix))) {
    endMs = parseInt(endUnix, 10) * 1000;
  } else if (endDate && endHms) {
    endMs = parseHmsOnDate(endDate, endHms);
  } else if (endHms && merchantDate) {
    endMs = parseHmsOnDate(merchantDate, endHms);
  }

  if (Number.isNaN(endMs)) {
    setDashes(dEl, hEl, mEl, sEl);
    if (phaseEl) phaseEl.hidden = true;
    return;
  }

  let startMs = NaN;
  if (startHms) {
    const sd = startDate || merchantDate;
    if (sd) startMs = parseHmsOnDate(sd, startHms);
  }
  const hasStart = startHms && !Number.isNaN(startMs);

  const now = Date.now();

  if (now >= endMs) {
    setEnded(dEl, hEl, mEl, sEl);
    if (phaseEl) phaseEl.hidden = true;
    return;
  }

  let targetMs;
  if (hasStart && now < startMs) {
    targetMs = startMs;
    if (phaseEl) {
      phaseEl.textContent = 'Starts in';
      phaseEl.hidden = false;
    }
  } else {
    targetMs = endMs;
    if (phaseEl) {
      if (hasStart && now >= startMs) {
        phaseEl.textContent = 'Ends in';
        phaseEl.hidden = false;
      } else {
        phaseEl.hidden = true;
      }
    }
  }

  const diffSec = Math.floor((targetMs - now) / 1000);
  setDhms(Math.max(0, diffSec), dEl, hEl, mEl, sEl);
}

function init() {
  document.querySelectorAll('[data-collection-countdown]').forEach((root) => {
    tick(root);
    setInterval(() => tick(root), 1000);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
