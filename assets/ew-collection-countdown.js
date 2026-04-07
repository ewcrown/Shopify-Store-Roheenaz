/**
 * Collection countdown — reads ISO datetimes from data-start-iso / data-end-iso.
 * Before start: counts down to start ("Starts in"). After start, before end: counts down to end ("Ends in").
 */

function pad2(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function setDashes(daysEl, hoursEl, minsEl, secsEl) {
  daysEl.textContent = '—';
  hoursEl.textContent = '—';
  minsEl.textContent = '—';
  secsEl.textContent = '—';
}

function setZeros(daysEl, hoursEl, minsEl, secsEl) {
  daysEl.textContent = '0';
  hoursEl.textContent = '00';
  minsEl.textContent = '00';
  secsEl.textContent = '00';
}

function applyDiff(diffSec, daysEl, hoursEl, minsEl, secsEl) {
  let diff = Math.max(0, diffSec);
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const mins = Math.floor(diff / 60);
  const secs = diff - mins * 60;

  daysEl.textContent = String(days);
  hoursEl.textContent = pad2(hours);
  minsEl.textContent = pad2(mins);
  secsEl.textContent = pad2(secs);
}

function tick(root) {
  const startIso = root.dataset.startIso || '';
  const endIso = root.dataset.endIso || '';
  const daysEl = root.querySelector('[data-ew-countdown-days]');
  const hoursEl = root.querySelector('[data-ew-countdown-hours]');
  const minsEl = root.querySelector('[data-ew-countdown-mins]');
  const secsEl = root.querySelector('[data-ew-countdown-secs]');
  const phaseEl = root.querySelector('[data-ew-countdown-phase]');

  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  if (!endIso) {
    setDashes(daysEl, hoursEl, minsEl, secsEl);
    if (phaseEl) phaseEl.hidden = true;
    return;
  }

  const endMs = Date.parse(endIso);
  if (Number.isNaN(endMs)) {
    setDashes(daysEl, hoursEl, minsEl, secsEl);
    if (phaseEl) phaseEl.hidden = true;
    return;
  }

  const startMs = startIso ? Date.parse(startIso) : NaN;
  const hasStart = startIso && !Number.isNaN(startMs);
  const now = Date.now();

  if (now >= endMs) {
    setZeros(daysEl, hoursEl, minsEl, secsEl);
    if (phaseEl) {
      phaseEl.hidden = true;
    }
    return;
  }

  let diffSec;
  if (hasStart && now < startMs) {
    diffSec = Math.floor((startMs - now) / 1000);
    if (phaseEl) {
      phaseEl.textContent = 'Starts in';
      phaseEl.hidden = false;
    }
  } else {
    diffSec = Math.floor((endMs - now) / 1000);
    if (phaseEl) {
      if (hasStart && now >= startMs) {
        phaseEl.textContent = 'Ends in';
        phaseEl.hidden = false;
      } else {
        phaseEl.hidden = true;
      }
    }
  }

  applyDiff(diffSec, daysEl, hoursEl, minsEl, secsEl);
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
