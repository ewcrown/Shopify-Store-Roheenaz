/**
 * Mobile product page: sticky bar, variant drawer
 * Header group height: restore when header-is-sticky is removed
 */
document.addEventListener('DOMContentLoaded', function () {
  // Recalculate --header-group-height when header-is-sticky is removed from body
  function recalcHeaderGroupHeight() {
    var header = document.querySelector('#header-component');
    var headerGroup = document.querySelector('#header-group');
    if (!header || !headerGroup) return;
    var total = 0;
    for (var i = 0; i < headerGroup.children.length; i++) {
      var el = headerGroup.children[i];
      if (el instanceof HTMLElement) total += el.offsetHeight;
    }
    if (header.hasAttribute('transparent') && header.parentElement && header.parentElement.nextElementSibling) {
      total += header.offsetHeight;
    }
    document.body.style.setProperty('--header-group-height', Math.round(total) + 'px');
  }

  var mo = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      if (m.type === 'attributes' && m.attributeName === 'class') {
        if (!document.body.classList.contains('header-is-sticky')) {
          requestAnimationFrame(function () {
            requestAnimationFrame(recalcHeaderGroupHeight);
          });
        }
      }
    });
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  var sectionId = document.querySelector('[data-section-id]')?.closest('.shopify-section')?.id?.replace('shopify-section-', '');
  var productSection = document.querySelector('.product-information')?.closest('.shopify-section');
  var isProductPage = document.body.classList.contains('template-product') || window.location.pathname.includes('/products/');

  function initStickyBar() {
    if (window.innerWidth >= 750) return;
    var stickyBar = document.querySelector('sticky-add-to-cart [ref="stickyBar"]');
    if (stickyBar) stickyBar.dataset.stuck = 'true';
  }

  function initVariantDrawer() {
    if (window.innerWidth >= 750 || !isProductPage) return;

    var drawer = document.querySelector('.product-variant-drawer');
    if (!drawer || drawer.dataset.initialized === 'true') return;

    var content = drawer.querySelector('.product-variant-drawer__content');
    if (!content) return;

    var section = drawer.closest('.shopify-section');
    if (!section) return;

    var variantPicker = section.querySelector('variant-picker');
    var buyButtons = section.querySelector('.buy-buttons-block');

    if (variantPicker && !content.contains(variantPicker)) {
      content.appendChild(variantPicker);
    }
    if (buyButtons && !content.contains(buyButtons)) {
      content.appendChild(buyButtons);
    }
    drawer.dataset.initialized = 'true';
  }

  function openDrawer(drawerId) {
    var drawer = document.getElementById(drawerId);
    if (drawer) {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDrawer(drawerId) {
    var drawer = drawerId ? document.getElementById(drawerId) : document.querySelector('.product-variant-drawer.is-open');
    if (drawer) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  document.addEventListener('click', function (e) {
    var openBtn = e.target.closest('[data-drawer-open]');
    if (openBtn) {
      e.preventDefault();
      openDrawer(openBtn.dataset.drawerId);
      return;
    }
    var closeBtn = e.target.closest('[data-drawer-close]');
    if (closeBtn) {
      closeDrawer();
      return;
    }
  });

  initStickyBar();
  initVariantDrawer();

  window.addEventListener('resize', function () {
    initStickyBar();
    if (window.innerWidth >= 750) closeDrawer();
  });
});
