(function() {
  'use strict';

  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============== CURSOR ==============
  if (!isCoarse) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let visible = false;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        dot.classList.add('is-visible');
        ring.classList.add('is-visible');
        visible = true;
      }
      dot.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0)`;
    });

    document.addEventListener('mouseleave', () => {
      dot.classList.remove('is-visible');
      ring.classList.remove('is-visible');
      visible = false;
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.transform = `translate3d(${ringX - 16}px, ${ringY - 16}px, 0)`;
      requestAnimationFrame(animateRing);
    }
    animateRing();

    document.querySelectorAll('a, button, .polaroid, .work').forEach(el => {
      el.addEventListener('mouseenter', () => {
        ring.style.width = '56px';
        ring.style.height = '56px';
        ring.style.borderColor = 'rgba(255,255,255,0.8)';
      });
      el.addEventListener('mouseleave', () => {
        ring.style.width = '32px';
        ring.style.height = '32px';
        ring.style.borderColor = 'rgba(255,255,255,0.55)';
      });
    });
  }

  // ============== LINE MASK INDICES ==============
  document.querySelectorAll('[data-anim="line-mask"]').forEach(el => {
    el.querySelectorAll('.inner').forEach((inner, i) => {
      inner.style.setProperty('--i', i);
    });
  });

  // ============== INTERSECTION OBSERVER ==============
  if (!reducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    document.querySelectorAll('.fade-up, .fade-up-stagger, [data-anim="line-mask"], .hero__subtitle').forEach(el => {
      observer.observe(el);
    });

    window.addEventListener('load', () => {
      setTimeout(() => {
        document.querySelectorAll('.hero [data-anim="line-mask"], .hero__subtitle').forEach(el => {
          el.classList.add('is-in');
        });
      }, 200);
    });
  } else {
    document.querySelectorAll('.fade-up, .fade-up-stagger, [data-anim="line-mask"], .hero__subtitle').forEach(el => {
      el.classList.add('is-in');
    });
  }

  // ============== POLAROID ROTATION ==============
  document.querySelectorAll('.polaroid').forEach(p => {
    const r = p.dataset.rotation || ((Math.random() - 0.5) * 24);
    p.style.transform = `rotate(${r}deg)`;
    p.dataset.origRotation = r;
  });

  // ============== SMOOTH SCROLL ==============
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
          top: targetPosition,
          behavior: reducedMotion ? 'auto' : 'smooth'
        });
      }
    });
  });

  // ============== ACTIVE NAV HIGHLIGHT ==============
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__links a');

  function updateActiveNav() {
    let current = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    const navMap = {
      'top': 'Home',
      'manifesto': 'About',
      'works': 'Work',
      'process': 'Process',
      'approach': '',
      'index': '',
      'contact': 'Contact'
    };

    navLinks.forEach(link => {
      link.classList.remove('is-active');
      const href = link.getAttribute('href').replace('#', '');
      if (href === current) {
        link.classList.add('is-active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

})();