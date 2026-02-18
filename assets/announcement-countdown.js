/**
 * Announcement bar countdown: updates elements with data-end-date (format YYYY-MM-DD HH:MM).
 */
function parseCountdownEnd(value) {
  if (!value || typeof value !== 'string') return null;
  const s = value.trim();
  const space = s.indexOf(' ');
  const datePart = space > 0 ? s.slice(0, space) : s;
  const timePart = space > 0 ? s.slice(space + 1) : '23:59';
  const iso = `${datePart}T${timePart}:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function pad(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function tick(now, endMs, el) {
  const diff = Math.max(0, endMs - now);
  if (diff === 0) {
    el.querySelector('[data-days]').textContent = '00';
    el.querySelector('[data-hours]').textContent = '00';
    el.querySelector('[data-minutes]').textContent = '00';
    el.querySelector('[data-seconds]').textContent = '00';
    return true;
  }
  const s = Math.floor(diff / 1000) % 60;
  const m = Math.floor(diff / 60000) % 60;
  const h = Math.floor(diff / 3600000) % 24;
  const d = Math.floor(diff / 86400000);
  el.querySelector('[data-days]').textContent = pad(d);
  el.querySelector('[data-hours]').textContent = pad(h);
  el.querySelector('[data-minutes]').textContent = pad(m);
  el.querySelector('[data-seconds]').textContent = pad(s);
  return false;
}

function runCountdown(el) {
  const endMs = parseCountdownEnd(el.getAttribute('data-end-date'));
  if (endMs == null) return;
  let intervalId;
  const update = () => {
    const done = tick(Date.now(), endMs, el);
    if (done && intervalId) {
      clearInterval(intervalId);
    }
  };
  update();
  intervalId = setInterval(update, 1000);
}

function init() {
  document.querySelectorAll('.announcement-bar__countdown[data-end-date]').forEach(runCountdown);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
