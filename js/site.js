(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Curtain load ---- */
  var curtain = document.querySelector('.curtain');
  if (curtain) {
    var open = function () {
      curtain.classList.add('open');
      setTimeout(function () { curtain.classList.add('done'); }, 1100);
    };
    if (reduce) curtain.classList.add('done');
    else if (document.readyState === 'complete') setTimeout(open, 150);
    else window.addEventListener('load', function () { setTimeout(open, 150); });
    setTimeout(open, 2500); // never trap the page behind slow images
  }

  /* ---- Scroll reveals ---- */
  var targets = [];
  function mark(el, i) {
    if (!el || el.hasAttribute('data-reveal')) return;
    el.setAttribute('data-reveal', '');
    el.style.setProperty('--d', Math.min(i, 5) * 80 + 'ms');
    targets.push(el);
  }
  document.querySelectorAll('main section').forEach(function (sec) {
    var wrap = sec.firstElementChild;
    if (!wrap) return;
    Array.prototype.forEach.call(wrap.children, function (child, i) {
      var display = getComputedStyle(child).display;
      if (display === 'grid') {
        // stagger the cards of a grid
        Array.prototype.forEach.call(child.children, function (c, j) { mark(c, j % 3); });
      } else if (child.hasAttribute('data-car-track')) {
        mark(child, 0);
      } else {
        mark(child, i === 0 ? 0 : 1);
      }
    });
    if (wrap.children.length === 0) mark(wrap, 0);
  });
  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach(function (t) { t.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---- Anchor scroll for #botanicals deep link ---- */
  if (location.hash) {
    var el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(function () { window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset - 100); }, 60);
  }

  /* ---- Carousel ---- */
  var track = document.querySelector('[data-car-track]');
  if (track) {
    var anim = null, paused = false, visible = true;
    var step = function (dir) {
      var card = track.querySelector('a');
      var w = card ? card.getBoundingClientRect().width + 18 : 300;
      var max = track.scrollWidth - track.clientWidth;
      var target = (Math.round(track.scrollLeft / w) + dir) * w;
      if (dir > 0 && track.scrollLeft >= max - 4) target = 0;
      else if (dir < 0 && track.scrollLeft <= 4) target = max;
      target = Math.max(0, Math.min(max, target));
      if (anim) cancelAnimationFrame(anim);
      var from = track.scrollLeft, t0 = performance.now(), dur = 420;
      track.style.scrollSnapType = 'none';
      var tick = function (now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        track.scrollLeft = from + (target - from) * e;
        if (k < 1) anim = requestAnimationFrame(tick);
        else { anim = null; track.style.scrollSnapType = 'x proximity'; }
      };
      anim = requestAnimationFrame(tick);
    };
    var wrap = track.parentElement;
    wrap.addEventListener('mouseenter', function () { paused = true; });
    wrap.addEventListener('mouseleave', function () { paused = false; });
    var prev = document.querySelector('[data-car-prev]'), next = document.querySelector('[data-car-next]');
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(track);
    }
    if (!reduce) setInterval(function () { if (!paused && visible && !document.hidden) step(1); }, 3500);
  }
})();

/* ---- Mobile menu ---- */
(function () {
  var header = document.querySelector('.site-header'), btn = document.querySelector('.nav-toggle');
  if (!header || !btn) return;
  function set(open) {
    header.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  }
  btn.addEventListener('click', function () { set(!header.classList.contains('open')); });
  header.querySelectorAll('.site-nav a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); btn.focus(); } });
  document.addEventListener('click', function (e) { if (!header.contains(e.target)) set(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 980) set(false); });
})();

/* ---- News: progressive "load more" ---- */
(function () {
  var grid = document.querySelector('[data-news-grid]'), more = document.querySelector('[data-news-more]');
  if (!grid || !more) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-news-card]')), PAGE = 9, shown = PAGE;
  function render() {
    cards.forEach(function (c, i) { c.hidden = i >= shown; });
    more.hidden = shown >= cards.length;
  }
  more.addEventListener('click', function () { shown += PAGE; render(); });
  render();
})();
