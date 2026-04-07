// Theme custom JS hooks.
// Quickview (quick-add): disable page overscroll behind dialog.

(function () {
  function setQuickviewOpen(isOpen) {
    document.documentElement.toggleAttribute('data-quickview-open', isOpen);
    document.body?.toggleAttribute('data-quickview-open', isOpen);
  }

  function isQuickviewOpen() {
    return (
      document.documentElement.hasAttribute('data-quickview-open') ||
      Boolean(document.querySelector('#quick-add-dialog dialog[open]'))
    );
  }

  function openCartDrawer() {
    const drawer = /** @type {any} */ (document.querySelector('cart-drawer-component'));
    if (!drawer) return;
    if (typeof drawer.open === 'function') {
      drawer.open();
      return;
    }
    // Fallback: click header cart trigger if method isn't available yet
    const trigger = document.querySelector('[data-testid="cart-drawer-trigger"]');
    if (trigger instanceof HTMLElement) trigger.click();
  }

  // DialogComponent dispatches these events.
  document.addEventListener('dialog:open', function (event) {
    var target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id !== 'quick-add-dialog' && !target.closest('#quick-add-dialog')) return;
    setQuickviewOpen(true);
  });

  document.addEventListener('dialog:close', function (event) {
    var target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id !== 'quick-add-dialog' && !target.closest('#quick-add-dialog')) return;
    setQuickviewOpen(false);
  });

  // When quickview add-to-cart succeeds, close quickview (handled elsewhere) and open cart drawer.
  document.addEventListener('cart:update', function (event) {
    const ev = /** @type {any} */ (event);
    const didError = Boolean(ev?.detail?.data?.didError);
    if (didError) return;
    const source = ev?.detail?.data?.source;

    // Quickview behavior
    if (isQuickviewOpen()) {
      // Let the quickview close animation run first
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(openCartDrawer);
      });
      return;
    }

    // PDP mobile bar behavior (only on product page)
    const isProductPage = document.body?.getAttribute('data-page-type') === 'product';
    const hasMobileBar = Boolean(document.querySelector('.ew-mobile-product-bar__add-to-cart'));
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 749px)').matches;

    if (isProductPage && isMobile && hasMobileBar && source === 'product-form-component') {
      window.requestAnimationFrame(openCartDrawer);
    }
  });
})();

