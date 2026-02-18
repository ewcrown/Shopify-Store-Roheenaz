/**
 * Custom header mega menu – open/close and accessibility.
 * No dependency on theme components.
 */
(function () {
  const selector = '[data-custom-mega]';
  const detailsSel = '[data-details]';
  const backdropSel = '[data-backdrop]';
  const bodyOpenClass = 'custom-mega-open';

  function init(container) {
    const details = container.querySelector(detailsSel);
    const summary = details?.querySelector('summary');
    const backdrop = container.querySelector(backdropSel);

    if (!details || !summary) return;

    function close() {
      details.removeAttribute('open');
      summary?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove(bodyOpenClass);
    }

    function open() {
      summary?.setAttribute('aria-expanded', 'true');
      document.body.classList.add(bodyOpenClass);
    }

    function onToggle() {
      if (details.hasAttribute('open')) {
        document.body.classList.add(bodyOpenClass);
      } else {
        document.body.classList.remove(bodyOpenClass);
      }
      summary?.setAttribute('aria-expanded', details.hasAttribute('open'));
    }

    summary?.addEventListener('click', () => {
      requestAnimationFrame(onToggle);
    });

    details?.addEventListener('toggle', onToggle);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!details.hasAttribute('open')) return;
      close();
    });

    backdrop?.addEventListener('click', close);
  }

  function initAll() {
    document.querySelectorAll(selector).forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', initAll);
})();
