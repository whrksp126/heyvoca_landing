// 스크롤 리빌. data-reveal / data-reveal-stagger 가 붙은 노드가 viewport에 진입하면 is-in 추가.
// global.css가 opacity/transform transition을 정의함.
(function () {
  if (typeof window === 'undefined') return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach(function (el) {
      el.classList.add('is-in');
    });
    return;
  }
  var observed = new WeakSet();
  function observe(target) {
    if (observed.has(target)) return;
    observed.add(target);
    io.observe(target);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        // Stagger: per-child delay
        if (el.hasAttribute('data-reveal-stagger')) {
          var step = parseInt(el.getAttribute('data-stagger-ms') || '80', 10);
          Array.prototype.slice.call(el.children).forEach(function (child, i) {
            child.style.transitionDelay = i * step + 'ms';
          });
        }
        el.classList.add('is-in');
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  function init() {
    document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach(observe);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
