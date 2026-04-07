import { morph } from '@theme/morph';
import { Component } from '@theme/component';
import { CartUpdateEvent, ThemeEvents, VariantSelectedEvent } from '@theme/events';
import { DialogComponent, DialogCloseEvent } from '@theme/dialog';
import { mediaQueryLarge, isMobileBreakpoint, getIOSVersion } from '@theme/utilities';
import VariantPicker from '@theme/variant-picker';

export class QuickAddComponent extends Component {
  /** @type {AbortController | null} */
  #abortController = null;
  /** @type {Map<string, Element>} */
  #cachedContent = new Map();
  /** @type {AbortController} */
  #cartUpdateAbortController = new AbortController();

  get productPageUrl() {
    const productCard = /** @type {import('./product-card').ProductCard | null} */ (this.closest('product-card'));
    const hotspotProduct = /** @type {import('./product-hotspot').ProductHotspotComponent | null} */ (
      this.closest('product-hotspot-component')
    );
    const productLink =
      productCard?.getProductCardLink() ||
      hotspotProduct?.getHotspotProductLink() ||
      /** @type {HTMLAnchorElement | null} */ (this.querySelector('a[data-quickview-product-link]'));

    if (!productLink?.href) return '';

    const url = new URL(productLink.href);

    if (url.searchParams.has('variant')) {
      return url.toString();
    }

    const selectedVariantId = this.#getSelectedVariantId();
    if (selectedVariantId) {
      url.searchParams.set('variant', selectedVariantId);
    }

    return url.toString();
  }

  /**
   * Gets the currently selected variant ID from the product card or form
   * @returns {string | null} The variant ID or null
   */
  #getSelectedVariantId() {
    const productCard = /** @type {import('./product-card').ProductCard | null} */ (this.closest('product-card'));
    if (productCard) return productCard.getSelectedVariantId();
    const variantInput = /** @type {HTMLInputElement | null} */ (this.querySelector('input[name="id"]'));
    return variantInput?.value || null;
  }

  connectedCallback() {
    super.connectedCallback();

    mediaQueryLarge.addEventListener('change', this.#closeQuickAddModal);
    document.addEventListener(ThemeEvents.cartUpdate, this.#handleCartUpdate, {
      signal: this.#cartUpdateAbortController.signal,
    });
    document.addEventListener(ThemeEvents.variantSelected, this.#updateQuickAddButtonState.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    mediaQueryLarge.removeEventListener('change', this.#closeQuickAddModal);
    this.#abortController?.abort();
    this.#cartUpdateAbortController.abort();
    document.removeEventListener(ThemeEvents.variantSelected, this.#updateQuickAddButtonState.bind(this));
  }

  /**
   * Clears the cached content when cart is updated
   */
  #handleCartUpdate = () => {
    this.#cachedContent.clear();
  };

  /**
   * Re-renders the variant picker in the quick-add modal.
   * @param {Element} newHtml - The element to re-render.
   */
  #updateVariantPicker(newHtml) {
    const modalContent = document.getElementById('quick-add-modal-content');
    if (!modalContent) return;
    const variantPicker = /** @type {VariantPicker} */ (modalContent.querySelector('variant-picker'));
    variantPicker.updateVariantPicker(newHtml);
  }

  /**
   * Get the product grid element from a fetched product page document.
   * Tries multiple selectors for theme compatibility.
   * @param {Document} html - Parsed product page document
   * @returns {Element | null}
   */
  #getProductGridFromDocument(html) {
    return (
      html.querySelector('[data-product-grid-content]') ||
      html.querySelector('.product-information__grid') ||
      html.querySelector('[data-testid="product-information"] .product-information__grid')
    );
  }

  /**
   * Handles quick add button click
   * @param {Event} event - The click event
   */
  handleClick = async (event) => {
    event.preventDefault();

    const currentUrl = this.productPageUrl;
    const modalContent = document.getElementById('quick-add-modal-content');
    if (!modalContent) return;

    // Check if we have cached content for this URL
    let productGrid = this.#cachedContent.get(currentUrl);

    if (!productGrid) {
      // Fetch and cache the content
      const html = await this.fetchProductPage(currentUrl);
      if (html) {
        const gridElement = this.#getProductGridFromDocument(html);
        if (gridElement) {
          // Cache the cloned element to avoid modifying the original
          productGrid = /** @type {Element} */ (gridElement.cloneNode(true));
          this.#cachedContent.set(currentUrl, productGrid);
        }
      }
    }

    if (productGrid) {
      // Use a fresh clone from the cache
      const freshContent = /** @type {Element} */ (productGrid.cloneNode(true));
      await this.updateQuickAddModal(freshContent);
      this.#updateVariantPicker(productGrid);
    } else {
      // No grid found: show fallback with title and link to full product page
      const title = this.dataset.productTitle || 'Product';
      const fallback = document.createElement('div');
      fallback.className = 'quick-add-modal__fallback';
      const inner = document.createElement('div');
      inner.className = 'quick-add-modal__fallback-inner';
      const heading = document.createElement('h2');
      heading.className = 'quick-add-modal__fallback-title';
      const titleLink = document.createElement('a');
      titleLink.href = currentUrl;
      titleLink.textContent = title;
      heading.appendChild(titleLink);
      const text = document.createElement('p');
      text.className = 'quick-add-modal__fallback-text';
      const ctaLink = document.createElement('a');
      ctaLink.href = currentUrl;
      ctaLink.className = 'button button--primary';
      ctaLink.textContent = 'View full product details';
      text.appendChild(ctaLink);
      inner.appendChild(heading);
      inner.appendChild(text);
      fallback.appendChild(inner);
      morph(modalContent, fallback);
    }

    this.#openQuickAddModal();
  };

  #resetScroll() {
    const dialogComponent = document.getElementById('quick-add-dialog');
    if (!(dialogComponent instanceof QuickAddDialog)) return;

    const productDetails = dialogComponent.querySelector('.product-details');
    const productMedia = dialogComponent.querySelector('.product-information__media');
    productDetails?.scrollTo({ top: 0, behavior: 'instant' });
    productMedia?.scrollTo({ top: 0, behavior: 'instant' });
  }

  /** @param {QuickAddDialog} dialogComponent */
  #stayVisibleUntilDialogCloses(dialogComponent) {
    this.toggleAttribute('stay-visible', true);

    dialogComponent.addEventListener(DialogCloseEvent.eventName, () => this.toggleAttribute('stay-visible', false), {
      once: true,
    });
  }

  #openQuickAddModal = () => {
    const dialogComponent = document.getElementById('quick-add-dialog');
    if (!(dialogComponent instanceof QuickAddDialog)) return;

    this.#stayVisibleUntilDialogCloses(dialogComponent);

    dialogComponent.showDialog();

    // is nondeterministic when the open attribute is set on the dialog element after .showDialog() is called.
    // Waiting until the open animation starts seemed to be the most reliable metric here.
    const dialog = dialogComponent.refs?.dialog;
    if (!dialog) return;
    dialog.addEventListener('animationstart', this.#resetScroll.bind(this), { once: true });
  };

  #closeQuickAddModal = () => {
    const dialogComponent = document.getElementById('quick-add-dialog');
    if (!(dialogComponent instanceof QuickAddDialog)) return;

    dialogComponent.closeDialog();
  };

  /**
   * Fetches the product page content
   * @param {string} productPageUrl - The URL of the product page to fetch
   * @returns {Promise<Document | null>}
   */
  async fetchProductPage(productPageUrl) {
    if (!productPageUrl) return null;

    // We use this to abort the previous fetch request if it's still pending.
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    try {
      const response = await fetch(productPageUrl, {
        signal: this.#abortController.signal,
        headers: { Accept: 'text/html' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product page: HTTP error ${response.status}`);
      }

      const responseText = await response.text();
      const html = new DOMParser().parseFromString(responseText, 'text/html');

      return html;
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      } else {
        throw error;
      }
    } finally {
      this.#abortController = null;
    }
  }

  /**
   * Removes video / external video from quickview gallery (carousel + grid) so quickview shows images only.
   * Drops slideshow-controls so {@link #enableQuickviewSlider} can inject dots matching the remaining slide count.
   * @param {Element} root - Cloned product grid (not cached)
   */
  #stripVideoMediaFromQuickview(root) {
    const isVideoSlideClass = (el) =>
      el.classList.contains('product-media-container--video') ||
      el.classList.contains('product-media-container--external_video');

    const videoInnerSelector = '.product-media-container--video, .product-media-container--external_video';

    // Grid presentation: remove video list items
    root.querySelectorAll('ul.media-gallery__grid > li').forEach((li) => {
      if (isVideoSlideClass(li)) li.remove();
    });

    // Two images per frame: remove video halves, then drop empty slides
    root.querySelectorAll('slideshow-slide.media-gallery__slide--two-per-frame').forEach((slide) => {
      slide.querySelectorAll(videoInnerSelector).forEach((node) => node.remove());
      const frame = slide.querySelector('.media-gallery__frame');
      const remaining = frame?.querySelectorAll('[class*="product-media-container--"]');
      if (!remaining?.length) slide.remove();
    });

    // One media per slide: remove entire video slides
    root.querySelectorAll('slideshow-slide:not(.media-gallery__slide--two-per-frame)').forEach((slide) => {
      if (isVideoSlideClass(slide)) slide.remove();
    });

    // Zoom dialog (if present): remove video slides and matching thumbnail buttons (same index)
    const zoomGallery = root.querySelector('zoom-dialog .dialog-zoomed-gallery');
    const zoomThumbs = root.querySelector('zoom-dialog scroll-hint.dialog-thumbnails-list');
    if (zoomGallery && zoomThumbs) {
      const lis = Array.from(zoomGallery.querySelectorAll(':scope > li'));
      const thumbs = Array.from(zoomThumbs.querySelectorAll(':scope > button'));
      const indicesToRemove = lis
        .map((li, i) => (isVideoSlideClass(li) ? i : -1))
        .filter((i) => i >= 0)
        .sort((a, b) => b - a);
      for (const i of indicesToRemove) {
        lis[i]?.remove();
        thumbs[i]?.remove();
      }
    }

    root.querySelectorAll('media-gallery slideshow-controls').forEach((el) => el.remove());
  }

  /**
   * Re-renders the variant picker.
   * @param {Element} productGrid - The product grid element
   */
  async updateQuickAddModal(productGrid) {
    const modalContent = document.getElementById('quick-add-modal-content');

    if (!productGrid || !modalContent) return;

    this.#stripVideoMediaFromQuickview(productGrid);

    if (isMobileBreakpoint()) {
      const productDetails = productGrid.querySelector('.product-details');
      const productFormComponent = productGrid.querySelector('product-form-component');
      const variantPicker = productGrid.querySelector('variant-picker');
      const productPrice = productGrid.querySelector('product-price');
      const productTitle = document.createElement('a');
      productTitle.textContent = this.dataset.productTitle || '';

      // Make product title as a link to the product page
      productTitle.href = this.productPageUrl;

      const productHeader = document.createElement('div');
      productHeader.classList.add('product-header');

      productHeader.appendChild(productTitle);
      if (productPrice) {
        productHeader.appendChild(productPrice);
      }
      productGrid.appendChild(productHeader);

      if (variantPicker) {
        productGrid.appendChild(variantPicker);
      }
      if (productFormComponent) {
        productGrid.appendChild(productFormComponent);
      }

      productDetails?.remove();
    }

    morph(modalContent, productGrid);

    this.#enableQuickviewSlider(modalContent);
    this.#syncVariantSelection(modalContent);
  }

  /**
   * Quickview: force the media gallery carousel to behave like a slider on all viewports.
   * The theme sets `mobile-disabled` on the slideshow for carousel presentation; on this build,
   * PDP mobile CSS converts that to a vertical list. In quickview we want a real slider.
   * @param {Element} modalContent
   */
  #enableQuickviewSlider(modalContent) {
    const slideshows = modalContent.querySelectorAll('slideshow-component');
    if (!slideshows.length) return;

    for (const el of slideshows) {
      const clone = /** @type {HTMLElement} */ (el.cloneNode(true));
      el.replaceWith(clone);

      clone.removeAttribute('mobile-disabled');
      clone.removeAttribute('disabled');
      clone.setAttribute('disabled', 'false');
      clone.setAttribute('in-viewport', '');

      // If no slideshow-controls exist (grid-layout products), inject dot pagination
      if (!clone.querySelector('slideshow-controls')) {
        const slides = clone.querySelectorAll('slideshow-slide');
        if (slides.length > 1) {
          this.#injectQuickviewDots(clone, slides);
        }
      }
    }
  }

  /**
   * Creates and injects dot pagination for quickview slideshows that lack controls.
   * @param {HTMLElement} slideshowEl - The slideshow-component element
   * @param {NodeListOf<Element>} slides - The slide elements
   */
  #injectQuickviewDots(slideshowEl, slides) {
    const dotsWrapper = document.createElement('div');
    dotsWrapper.className = 'ew-quickview-dots';

    for (let i = 0; i < slides.length; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'ew-quickview-dot';
      dot.setAttribute('aria-label', `Slide ${i + 1} of ${slides.length}`);
      if (i === 0) dot.classList.add('ew-quickview-dot--active');

      dot.addEventListener('click', () => {
        const slide = slides[i];
        if (slide instanceof HTMLElement) {
          slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      });

      dotsWrapper.appendChild(dot);
    }

    // Insert after slideshow-container
    const container = slideshowEl.querySelector('slideshow-container');
    if (container) {
      container.after(dotsWrapper);
    } else {
      slideshowEl.appendChild(dotsWrapper);
    }

    // Sync dots on scroll (horizontal on mobile quickview, vertical on desktop)
    const scroller = slideshowEl.querySelector('slideshow-slides');
    if (scroller) {
      let scrollTimer;
      scroller.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          const dots = dotsWrapper.querySelectorAll('.ew-quickview-dot');
          const horizontal =
            scroller.scrollWidth > scroller.clientWidth + 1 &&
            scroller.scrollHeight <= scroller.clientHeight + 1;
          let activeIndex = 0;
          if (horizontal) {
            const slideWidth = scroller.clientWidth;
            activeIndex = Math.round(scroller.scrollLeft / Math.max(slideWidth, 1));
          } else {
            const center = scroller.scrollTop + scroller.clientHeight / 2;
            for (let j = 0; j < slides.length; j++) {
              const slide = slides[j];
              if (!(slide instanceof HTMLElement)) continue;
              const top = slide.offsetTop;
              const bottom = top + slide.offsetHeight;
              if (center >= top && center <= bottom) {
                activeIndex = j;
                break;
              }
              if (center > bottom) activeIndex = j;
            }
          }
          activeIndex = Math.min(Math.max(activeIndex, 0), dots.length - 1);
          dots.forEach((d, j) => d.classList.toggle('ew-quickview-dot--active', j === activeIndex));
        }, 50);
      }, { passive: true });
    }
  }

  /**
   * Updates the quick-add button state based on whether a swatch is selected
   * @param {VariantSelectedEvent} event - The variant selected event
   */
  #updateQuickAddButtonState(event) {
    if (!(event.target instanceof HTMLElement)) return;
    if (event.target.closest('product-card') !== this.closest('product-card')) return;
    const productOptionsCount = this.dataset.productOptionsCount;
    const quickAddButton = productOptionsCount === '1' ? 'add' : 'choose';
    this.setAttribute('data-quick-add-button', quickAddButton);
  }

  /**
   * Syncs the variant selection from the product card to the modal
   * @param {Element} modalContent - The modal content element
   */
  #syncVariantSelection(modalContent) {
    const selectedVariantId = this.#getSelectedVariantId();
    if (!selectedVariantId) return;

    // Find and check the corresponding input in the modal
    const modalInputs = modalContent.querySelectorAll('input[type="radio"][data-variant-id]');
    for (const input of modalInputs) {
      if (input instanceof HTMLInputElement && input.dataset.variantId === selectedVariantId && !input.checked) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  }
}

if (!customElements.get('quick-add-component')) {
  customElements.define('quick-add-component', QuickAddComponent);
}

class QuickAddDialog extends DialogComponent {
  #abortController = new AbortController();

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener(ThemeEvents.cartUpdate, this.handleCartUpdate, { signal: this.#abortController.signal });
    this.addEventListener(ThemeEvents.variantUpdate, this.#updateProductTitleLink);

    this.addEventListener(DialogCloseEvent.eventName, this.#handleDialogClose);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#abortController.abort();
    this.removeEventListener(DialogCloseEvent.eventName, this.#handleDialogClose);
  }

  /**
   * Closes the dialog
   * @param {CartUpdateEvent} event - The cart update event
   */
  handleCartUpdate = (event) => {
    if (event.detail.data.didError) return;
    this.closeDialog();
  };

  #updateProductTitleLink = (/** @type {CustomEvent} */ event) => {
    const anchorElement = /** @type {HTMLAnchorElement} */ (
      event.detail.data.html?.querySelector('.view-product-title a')
    );
    const viewMoreDetailsLink = /** @type {HTMLAnchorElement} */ (this.querySelector('.view-product-title a'));
    const mobileProductTitle = /** @type {HTMLAnchorElement} */ (this.querySelector('.product-header a'));

    if (!anchorElement) return;

    if (viewMoreDetailsLink) viewMoreDetailsLink.href = anchorElement.href;
    if (mobileProductTitle) mobileProductTitle.href = anchorElement.href;
  };

  #handleDialogClose = () => {
    const iosVersion = getIOSVersion();
    /**
     * This is a patch to solve an issue with the UI freezing when the dialog is closed.
     * To reproduce it, use iOS 16.0.
     */
    if (!iosVersion || iosVersion.major >= 17 || (iosVersion.major === 16 && iosVersion.minor >= 4)) return;

    requestAnimationFrame(() => {
      /** @type {HTMLElement | null} */
      const grid = document.querySelector('#ResultsList [product-grid-view]');
      if (grid) {
        const currentWidth = grid.getBoundingClientRect().width;
        grid.style.width = `${currentWidth - 1}px`;
        requestAnimationFrame(() => {
          grid.style.width = '';
        });
      }
    });
  };
}

if (!customElements.get('quick-add-dialog')) {
  customElements.define('quick-add-dialog', QuickAddDialog);
}
