/* SoLaNail premium effects — vanilla JS, no React */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    // 1. Lenis smooth scroll (only if available — fails gracefully)
    if (typeof Lenis !== 'undefined') {
      try {
        var lenis = new Lenis({
          duration: 1.4,
          easing: function (t) { return 1 - Math.pow(1 - t, 3); },
          smoothWheel: true,
          smoothTouch: false,
        });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
      } catch (e) {
        console.warn('Lenis init failed:', e);
      }
    }

    // 2. GSAP + ScrollTrigger — stagger reveal of product cards
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      try {
        gsap.registerPlugin(ScrollTrigger);
        var cards = document.querySelectorAll('.pcard');
        cards.forEach(function (card, i) {
          gsap.fromTo(card,
            { opacity: 0, y: 30 },
            {
              opacity: 1, y: 0,
              duration: 0.9, ease: 'power3.out',
              delay: (i % 4) * 0.08,
              scrollTrigger: { trigger: card, start: 'top 88%', once: true }
            }
          );
        });

        // Hero slight parallax (subtle, no extra scroll height)
        gsap.utils.toArray('.hero-bg-img, .hero-bg-video').forEach(function (el) {
          gsap.to(el, {
            yPercent: 8, ease: 'none',
            scrollTrigger: { trigger: el.closest('section'), start: 'top top', end: 'bottom top', scrub: true }
          });
        });
      } catch (e) {
        console.warn('GSAP init failed:', e);
      }
    }

    // 3. Spotlight effect — light follows cursor on product cards
    var pcards = document.querySelectorAll('.pcard');
    pcards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    });

    // 4. Magnetic CTA buttons (.btn-rose)
    document.querySelectorAll('.btn-rose').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) * 0.25;
        var y = (e.clientY - rect.top - rect.height / 2) * 0.25;
        btn.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });

    // 5. Hover-video on product cards
    pcards.forEach(function (card) {
      var video = card.querySelector('.product-hover-video');
      if (!video || !video.dataset.src) return;
      card.addEventListener('mouseenter', function () {
        if (!video.src) video.src = video.dataset.src;
        video.play().catch(function () { /* autoplay blocked, ignore */ });
      });
      card.addEventListener('mouseleave', function () {
        video.pause();
      });
    });

    // 6. Cart-add microinteraction (B3)
    document.querySelectorAll('.add-to-cart').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        // Ripple effect
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = (e.clientX - rect.left - 15) + 'px';
        ripple.style.top = (e.clientY - rect.top - 15) + 'px';
        ripple.style.width = ripple.style.height = '30px';
        btn.appendChild(ripple);
        setTimeout(function () { ripple.remove(); }, 700);

        // Pop animation
        btn.classList.add('popping');
        setTimeout(function () { btn.classList.remove('popping'); }, 450);

        // Add to "cart" — for MVP we don't have a real cart, so just show visual state
        if (!btn.classList.contains('added')) {
          var originalText = btn.textContent;
          btn.classList.add('added');
          btn.textContent = '✓ В корзине';
          setTimeout(function () {
            btn.classList.remove('added');
            btn.textContent = originalText;
          }, 1500);
        }
      });
    });

    // 7. Sergey sticky banner (B6)
    var pitch = document.getElementById('sergey-pitch');
    if (pitch) {
      var dismissedKey = 'solanail-sergey-pitch-dismissed';
      var dismissedAt = parseInt(localStorage.getItem(dismissedKey) || '0', 10);
      var thirtyDays = 30 * 24 * 60 * 60 * 1000;
      var stillDismissed = (Date.now() - dismissedAt) < thirtyDays;

      if (!stillDismissed) {
        var shown = false;
        function checkScroll() {
          if (shown) return;
          var max = document.body.scrollHeight - window.innerHeight;
          if (max <= 0) return;
          var pct = window.scrollY / max;
          if (pct > 0.55) {
            pitch.classList.add('visible');
            pitch.setAttribute('aria-hidden', 'false');
            shown = true;
            window.removeEventListener('scroll', checkScroll);
          }
        }
        window.addEventListener('scroll', checkScroll, { passive: true });
      }

      var closeBtn = pitch.querySelector('.sp-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          pitch.classList.remove('visible');
          pitch.setAttribute('aria-hidden', 'true');
          localStorage.setItem(dismissedKey, String(Date.now()));
        });
      }
    }
  });
})();
