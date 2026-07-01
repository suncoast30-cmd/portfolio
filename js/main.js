(() => {
  // =====================
  // Smooth scroll nav
  // =====================
  const nav = document.getElementById('nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Mobile menu toggle
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // =====================
  // Fade-in on scroll
  // =====================
  const fadeElements = document.querySelectorAll('.fade-in');

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  fadeElements.forEach(el => fadeObserver.observe(el));

  // =====================
  // Gallery filtering
  // =====================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  function itemMatchesFilter(item, filter) {
    const category = item.dataset.category;
    // Sketches only show on the Drawing filter, never on the default "All" landing view
    if (category === 'sketch') return filter === 'drawing';
    return filter === 'all' || category === filter;
  }

  function applyFilter(filter) {
    galleryItems.forEach(item => {
      item.classList.toggle('hidden', !itemMatchesFilter(item, filter));
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });

  applyFilter('all');

  // =====================
  // Lightbox
  // =====================
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');

  let currentIndex = 0;

  // Zoom/pan state for the lightbox image
  let zoomScale = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let wasDragged = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panStartX = 0;
  let panStartY = 0;

  function applyZoom() {
    const img = lightboxImage.querySelector('img');
    if (!img) return;
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    img.classList.toggle('zoomed', zoomScale > 1);
  }

  function resetZoom() {
    zoomScale = 1;
    panX = 0;
    panY = 0;
    applyZoom();
  }

  function getVisibleItems() {
    return Array.from(galleryItems).filter(item => !item.classList.contains('hidden'));
  }

  function openLightbox(index) {
    const visible = getVisibleItems();
    currentIndex = index;
    const item = visible[currentIndex];
    const placeholder = item.querySelector('.placeholder-image');
    const titleEl = item.querySelector('h3');
    const detailEl = item.querySelector('p');
    const title = titleEl ? titleEl.textContent : '';
    const detail = detailEl ? detailEl.textContent : '';

    lightboxImage.innerHTML = '';

    if (placeholder.tagName === 'IMG') {
      // Real image — display it directly
      lightboxImage.style.background = 'none';
      lightboxImage.style.aspectRatio = '';
      lightboxImage.style.minWidth = '';
      lightboxImage.style.minHeight = '';
      const img = document.createElement('img');
      img.src = placeholder.src;
      img.style.cssText = 'max-width:80vw;max-height:70vh;object-fit:contain;border-radius:2px;display:block;';
      lightboxImage.appendChild(img);
    } else {
      // Gradient placeholder — clone the background
      const bg = getComputedStyle(placeholder).background;
      lightboxImage.style.background = bg;
      lightboxImage.style.aspectRatio = getComputedStyle(placeholder).aspectRatio;
      lightboxImage.style.minWidth = '';
      lightboxImage.style.minHeight = '';
    }

    lightboxCaption.textContent = [title, detail].filter(Boolean).join(' — ');
    resetZoom();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    prevBtn.style.display = '';
    nextBtn.style.display = '';
    resetZoom();
  }

  function navigate(direction) {
    const visible = getVisibleItems();
    currentIndex = (currentIndex + direction + visible.length) % visible.length;
    openLightbox(currentIndex);
  }

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const visible = getVisibleItems();
      const index = visible.indexOf(item);
      if (index !== -1) openLightbox(index);
    });
  });

  // Scroll to zoom in/out
  lightboxImage.addEventListener('wheel', (e) => {
    if (!lightboxImage.querySelector('img')) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    zoomScale = Math.min(4, Math.max(1, zoomScale + delta));
    if (zoomScale === 1) {
      panX = 0;
      panY = 0;
    }
    applyZoom();
  }, { passive: false });

  // Drag to pan when zoomed in
  lightboxImage.addEventListener('mousedown', (e) => {
    const img = lightboxImage.querySelector('img');
    if (!img || zoomScale <= 1) return;
    isPanning = true;
    wasDragged = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panStartX = panX;
    panStartY = panY;
    img.classList.add('panning');
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged = true;
    panX = panStartX + dx;
    panY = panStartY + dy;
    applyZoom();
  });

  window.addEventListener('mouseup', () => {
    if (!isPanning) return;
    isPanning = false;
    const img = lightboxImage.querySelector('img');
    if (img) img.classList.remove('panning');
  });

  // Click to toggle zoom (ignored if the click was actually a drag)
  lightboxImage.addEventListener('click', (e) => {
    e.stopPropagation();
    if (wasDragged) {
      wasDragged = false;
      return;
    }
    zoomScale = zoomScale > 1 ? 1 : 2;
    panX = 0;
    panY = 0;
    applyZoom();
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => navigate(-1));
  nextBtn.addEventListener('click', () => navigate(1));

  // Close on background click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  // Shop image lightbox
  document.querySelectorAll('.shop-item-image').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = img.closest('.shop-item');
      const title = item.querySelector('h3').textContent;
      const price = item.querySelector('.shop-item-price').textContent;

      lightboxImage.innerHTML = '';
      lightboxImage.style.background = 'none';
      lightboxImage.style.aspectRatio = '';
      const lightImg = document.createElement('img');
      lightImg.src = img.src;
      lightImg.style.cssText = 'max-width:80vw;max-height:70vh;object-fit:contain;border-radius:2px;display:block;';
      lightboxImage.appendChild(lightImg);

      lightboxCaption.textContent = `${title} — ${price}`;
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      resetZoom();
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // =====================
  // Shop filtering
  // =====================
  const shopFilterBtns = document.querySelectorAll('.shop-filter-btn');
  const shopItems = document.querySelectorAll('.shop-item');

  shopFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.shopFilter;
      shopFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      shopItems.forEach(item => {
        if (filter === 'all' || item.dataset.shopType === filter) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });

  // =====================
  // Cart
  // =====================
  let cart = [];
  const cartToggle = document.getElementById('cart-toggle');
  const cartCount = document.getElementById('cart-count');
  const cartModal = document.getElementById('cart-modal');
  const cartClose = document.getElementById('cart-close');
  const cartItemsEl = document.getElementById('cart-items');
  const cartFooter = document.getElementById('cart-footer');
  const cartTotalPrice = document.getElementById('cart-total-price');

  function updateCartUI() {
    cartCount.textContent = cart.length;

    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      cartFooter.style.display = 'none';
      return;
    }

    cartFooter.style.display = 'block';
    let total = 0;
    cartItemsEl.innerHTML = cart.map((item, i) => {
      total += item.price;
      return `
        <div class="cart-item">
          <div class="cart-item-details">
            <h4>${item.name}</h4>
          </div>
          <div class="cart-item-actions">
            <span class="cart-item-price">$${item.price.toLocaleString()}</span>
            <button class="cart-item-remove" data-index="${i}">&times;</button>
          </div>
        </div>
      `;
    }).join('');
    cartTotalPrice.textContent = `$${total.toLocaleString()}`;

    // Remove item buttons
    cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        cart.splice(parseInt(btn.dataset.index), 1);
        updateCartUI();
      });
    });
  }

  // Add to cart buttons
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const price = parseInt(btn.dataset.price);
      cart.push({ name, price });
      updateCartUI();

      btn.textContent = 'Added!';
      btn.classList.add('added');
      setTimeout(() => {
        btn.textContent = 'Add to Cart';
        btn.classList.remove('added');
      }, 1500);
    });
  });

  // Open/close cart
  cartToggle.addEventListener('click', () => {
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  cartClose.addEventListener('click', () => {
    cartModal.classList.remove('active');
    document.body.style.overflow = '';
  });

  cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
      cartModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // =====================
  // Checkout
  // =====================
  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutClose = document.getElementById('checkout-close');
  const checkoutForm = document.getElementById('checkout-form');
  const checkoutSummary = document.getElementById('checkout-summary');
  const checkoutTotalPrice = document.getElementById('checkout-total-price');
  const checkoutError = document.getElementById('checkout-error');
  const checkoutSpinner = document.getElementById('checkout-spinner');
  const btnCheckout = document.getElementById('btn-checkout');

  btnCheckout.addEventListener('click', () => {
    if (cart.length === 0) return;

    // Build summary
    let total = 0;
    checkoutSummary.innerHTML = cart.map(item => {
      total += item.price;
      return `<div class="checkout-summary-item"><span>${item.name}</span><span>$${item.price.toLocaleString()}</span></div>`;
    }).join('');
    checkoutTotalPrice.textContent = `$${total.toLocaleString()}`;

    // Show checkout, hide cart
    cartModal.classList.remove('active');
    checkoutForm.style.display = '';
    checkoutError.style.display = 'none';
    checkoutSpinner.style.display = 'none';
    checkoutModal.classList.add('active');
  });

  checkoutClose.addEventListener('click', () => {
    checkoutModal.classList.remove('active');
    document.body.style.overflow = '';
  });

  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) {
      checkoutModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    checkoutError.style.display = 'none';
    checkoutForm.style.display = 'none';
    checkoutSpinner.style.display = '';

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map(item => ({ name: item.name, price: item.price })) }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      window.location.href = data.url;
    } catch (err) {
      checkoutSpinner.style.display = 'none';
      checkoutForm.style.display = '';
      checkoutError.textContent = err.message;
      checkoutError.style.display = '';
    }
  });

  // =====================
  // Contact form
  // =====================
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    const originalText = btn.textContent;
    btn.textContent = 'Message Sent!';
    btn.style.background = '#2d6a4f';
    btn.style.borderColor = '#2d6a4f';
    btn.style.color = '#fff';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
      form.reset();
    }, 2500);
  });
})();
