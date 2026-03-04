/**
 * Custom header mega menu – open/close and accessibility.
 * No dependency on theme components.
 */
(function () {
  const selector = '[data-custom-mega]';
  const detailsSel = '[data-details]';
  const backdropSel = '[data-backdrop]';
  const bodyOpenClass = 'custom-mega-open';

  function addOpenClass() {
    document.documentElement.classList.add(bodyOpenClass);
    document.body.classList.add(bodyOpenClass);
  }

  function removeOpenClass() {
    document.documentElement.classList.remove(bodyOpenClass);
    document.body.classList.remove(bodyOpenClass);
  }

  const bodyBackdropClass = 'custom-mega__backdrop-body';
  const bodyBackdropAttr = 'data-mega-backdrop-body';

  function createBodyBackdrop(closeFn) {
    if (document.querySelector(`[${bodyBackdropAttr}]`)) return;
    const overlay = document.createElement('div');
    overlay.setAttribute(bodyBackdropAttr, '');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.className = bodyBackdropClass;
    overlay.addEventListener('click', closeFn);
    document.body.insertBefore(overlay, document.body.firstChild);
  }

  function removeBodyBackdrop() {
    const overlay = document.querySelector(`[${bodyBackdropAttr}]`);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  function init(container) {
    const details = container.querySelector(detailsSel);
    const summary = details?.querySelector('summary');

    if (!details || !summary) return;

    function close() {
      removeBodyBackdrop();
      details.removeAttribute('open');
      summary?.setAttribute('aria-expanded', 'false');
      removeOpenClass();
    }

    function open() {
      summary?.setAttribute('aria-expanded', 'true');
      addOpenClass();
    }

    function onToggle() {
      if (details.hasAttribute('open')) {
        addOpenClass();
        if (window.innerWidth <= 749) createBodyBackdrop(close);
      } else {
        removeBodyBackdrop();
        removeOpenClass();
      }
      summary?.setAttribute('aria-expanded', details.hasAttribute('open'));
    }

    summary?.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      details.toggleAttribute('open');
      if (summary === document.activeElement) {
        summary.blur();
      }
    }, true);

    details?.addEventListener('toggle', onToggle);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!details.hasAttribute('open')) return;
      close();
    });

    container.querySelectorAll(backdropSel).forEach((el) => el.addEventListener('click', close));
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
