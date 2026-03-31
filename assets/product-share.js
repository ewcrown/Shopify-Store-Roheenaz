(function () {
  function getShare(target) {
    return target.closest('[data-product-share]');
  }

  function openPanel(el) {
    var fallback = el.querySelector('[data-share-fallback]');
    var trigger  = el.querySelector('[data-share-trigger]');
    if (!fallback) return;
    fallback.classList.add('is-open');
    fallback.setAttribute('aria-hidden', 'false');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }

  function closePanel(el) {
    var fallback = el.querySelector('[data-share-fallback]');
    var trigger  = el.querySelector('[data-share-trigger]');
    if (!fallback) return;
    fallback.classList.remove('is-open');
    fallback.setAttribute('aria-hidden', 'true');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function copyUrl(el) {
    var urlInput  = el.querySelector('[data-share-url]');
    var messageEl = el.querySelector('[data-share-message]');
    if (!urlInput) return;
    urlInput.select();
    urlInput.setSelectionRange(0, 99999);
    try {
      navigator.clipboard.writeText(urlInput.value).then(function () {
        if (messageEl) {
          messageEl.classList.remove('hidden');
          setTimeout(function () { messageEl.classList.add('hidden'); }, 2500);
        }
      });
    } catch (e) {
      // Fallback for older browsers
      document.execCommand('copy');
      if (messageEl) {
        messageEl.classList.remove('hidden');
        setTimeout(function () { messageEl.classList.add('hidden'); }, 2500);
      }
    }
  }

  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!(target instanceof Element)) return;

    // Toggle share panel open/closed
    if (target.closest('[data-share-trigger]')) {
      var el = getShare(target);
      if (!el) return;
      e.preventDefault();
      var fallback = el.querySelector('[data-share-fallback]');
      fallback && fallback.classList.contains('is-open') ? closePanel(el) : openPanel(el);
      return;
    }

    // Close button inside panel
    if (target.closest('[data-share-close]')) {
      var el = getShare(target);
      if (el) closePanel(el);
      return;
    }

    // Copy link button
    if (target.closest('[data-share-copy]')) {
      var el = getShare(target);
      if (el) copyUrl(el);
      return;
    }

    // Click outside — close any open panel
    document.querySelectorAll('[data-share-fallback].is-open').forEach(function (fallback) {
      var el = getShare(fallback);
      if (el && !el.contains(target)) closePanel(el);
    });
  });
})();
