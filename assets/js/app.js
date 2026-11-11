/* leonilisin.com — motion + interactions. No build step; GSAP, ScrollTrigger and Lenis are served locally. */
(function () {
  'use strict';

  var root = document.documentElement;
  var FORMSPREE_ID = 'xpqbqylz';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var still = root.classList.contains('no-motion') || !hasGsap;
  if (still) { root.classList.add('no-motion'); root.classList.remove('is-intro', 'is-entering'); }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var lenis = null;
  var fmt = new Intl.NumberFormat('de-DE');
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function splitWords(el) {
    var out = [];
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!node.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span');
        s.className = 'sw';
        s.textContent = tok;
        frag.appendChild(s);
        out.push(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.classList.add('is-split');
    return out;
  }

  function fitAll() {
    $$('[data-fit]').forEach(function (el) {
      el.style.fontSize = '100px';
      var probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;white-space:nowrap';
      while (el.firstChild) probe.appendChild(el.firstChild);
      el.appendChild(probe);
      var w = probe.getBoundingClientRect().width;
      while (probe.firstChild) el.appendChild(probe.firstChild);
      el.removeChild(probe);
      if (w > 0) el.style.fontSize = (100 * (el.clientWidth / w) * 0.97).toFixed(2) + 'px';
    });
  }

  /* ------------------------------------------------------------------ */
  /* Nav + progress + mobile menu                                        */
  /* ------------------------------------------------------------------ */
  var nav = $('.nav');
  var lastY = window.scrollY;
  var progress = $('.progress');
  function onScrollFrame() {
    var y = window.scrollY;
    if (!root.classList.contains('menu-open')) {
      if (y > 420 && y > lastY + 4) nav.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 420) nav.classList.remove('is-hidden');
    }
    lastY = y;
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScrollFrame(); });
  }, { passive: true });
  onScrollFrame();

  var burger = $('.burger');
  var menu = $('.menu');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    else document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ------------------------------------------------------------------ */
  /* Links: in-page smooth scroll + colour wipe between pages            */
  /* ------------------------------------------------------------------ */
  function samePath(a, b) {
    var n = function (p) { return p.replace(/index\.html$/, '').replace(/\/+$/, '') || '/'; };
    return n(a) === n(b);
  }
  function scrollToEl(target, instant) {
    if (!target) return;
    if (lenis && !instant) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    else {
      var y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: still || instant ? 'auto' : 'smooth' });
    }
  }
  function preselect(why) {
    var input = $('.why input[value="' + why + '"]');
    if (input) input.checked = true;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (a.dataset.why) preselect(a.dataset.why);

    if (samePath(url.pathname, location.pathname)) {
      var target = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : document.body;
      if (!target) return;
      e.preventDefault();
      if (root.classList.contains('menu-open')) setMenu(false);
      if (!url.hash || a.hasAttribute('data-top')) {
        if (lenis) lenis.scrollTo(0, { duration: 1.6 }); else window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
      } else {
        scrollToEl(target);
        history.replaceState(null, '', url.hash);
      }
      return;
    }

    if (still) return;
    e.preventDefault();
    try { sessionStorage.setItem('li-nav', '1'); } catch (err) {}
    gsap.fromTo('.curtain i', { yPercent: 101, y: 0 }, {
      yPercent: 0, duration: 0.55, ease: 'expo.inOut', stagger: 0.09,
      onComplete: function () { location.href = url.href; }
    });
  });

  window.addEventListener('pageshow', function (e) {
    if (e.persisted && hasGsap) {
      gsap.set('.curtain i', { yPercent: 101 });
      root.classList.remove('is-entering', 'menu-open');
    }
  });

  /* ------------------------------------------------------------------ */
  /* Contact form                                                        */
  /* ------------------------------------------------------------------ */
  (function form() {
    var f = $('#kontakt-forma');
    if (!f) return;
    var wrap = f.closest('.form');
    var note = $('.form__note', f);
    var noteDefault = note ? note.textContent : '';
    var btn = $('.send', f);

    $$('.field input, .field textarea', f).forEach(function (inp) {
      var field = inp.closest('.field');
      var sync = function () { field.classList.toggle('is-filled', inp.value.trim() !== ''); };
      inp.addEventListener('input', function () {
        sync();
        field.classList.remove('is-bad');
        if (inp.tagName === 'TEXTAREA') { inp.style.height = 'auto'; inp.style.height = inp.scrollHeight + 'px'; }
      });
      inp.addEventListener('blur', sync);
      sync();
      setTimeout(sync, 600);
    });

    function bad(name, msg) {
      var inp = f.elements[name];
      var field = inp.closest('.field');
      field.classList.remove('is-bad');
      void field.offsetWidth;
      field.classList.add('is-bad');
      var err = $('.field__err', field);
      if (err) err.textContent = msg;
      return inp;
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        ime: f.elements.ime.value.trim(),
        email: f.elements.email.value.trim(),
        razlog: (f.elements.razlog.value || '').trim(),
        poruka: f.elements.poruka.value.trim()
      };
      var firstBad = null;
      $$('.field', f).forEach(function (x) { x.classList.remove('is-bad'); });
      if (!data.ime) firstBad = firstBad || bad('ime', 'Upiši ime');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) firstBad = firstBad || bad('email', 'Provjeri email');
      if (!data.poruka) firstBad = firstBad || bad('poruka', 'Napiši poruku');
      if (firstBad) { firstBad.focus(); return; }
      if (f.elements._gotcha && f.elements._gotcha.value) return;

      btn.disabled = true;
      btn.classList.add('is-busy');
      note.classList.remove('is-err');
      note.textContent = 'Šaljem…';

      fetch('https://formspree.io/f/' + FORMSPREE_ID, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ime: data.ime, email: data.email, razlog: data.razlog, poruka: data.poruka,
          _subject: 'leonilisin.com · ' + data.razlog + ' · ' + data.ime
        })
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok !== false }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error('send failed');
          var name = $('.form__done [data-name]', wrap);
          if (name) name.textContent = data.ime.split(' ')[0];
          wrap.classList.add('is-done');
          $('.form__done', wrap).setAttribute('aria-hidden', 'false');
          if (window.gtag) window.gtag('event', 'generate_lead', { razlog: data.razlog });
        })
        .catch(function () {
          note.textContent = 'Nije poslano. Pokušaj ponovno za minutu.';
          note.classList.add('is-err');
        })
        .then(function () {
          btn.disabled = false;
          btn.classList.remove('is-busy');
          if (!note.classList.contains('is-err')) note.textContent = noteDefault;
        });
    });
  })();

  /* Views counter that never stops (YouTube Shorts scene) */
  $$('[data-roll]').forEach(function (el) {
    var v = parseInt(el.dataset.roll, 10) || 0;
    setInterval(function () {
      if (document.hidden) return;
      v += Math.floor(Math.random() * 37) + 3;
      el.textContent = fmt.format(v);
    }, 140);
  });

  /* ------------------------------------------------------------------ */
  /* Everything below needs motion                                       */
  /* ------------------------------------------------------------------ */
  if (still) {
    fitAll();
    window.addEventListener('resize', fitAll);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    window.__liReady = true;
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'expo.out', duration: 1 });

  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.4 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* Tag things that should come in on scroll */
  $$('.prose > p, .steps li, .mod, .course__no > p:not([data-words]), .course__cta, .one__sig, .contact__lead, .contact__who, .bcard__top, .bcard__name, .bcard__meta, .bcard__desc, .bcard__link, .chap__media > .link, .tile__l, .foot__bar')
    .forEach(function (el) { if (!el.hasAttribute('data-reveal') && !el.hasAttribute('data-pop')) el.setAttribute('data-reveal', ''); });
  $$('.lesson, .bcard .browser').forEach(function (el) { el.setAttribute('data-pop', ''); });

  /* Split headings into words */
  var wordMap = new Map();
  $$('[data-words]').forEach(function (el) { wordMap.set(el, splitWords(el)); });
  $$('.foot__word').forEach(function (el) {
    var txt = el.textContent;
    el.textContent = '';
    txt.split('').forEach(function (ch) {
      var s = document.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
    });
  });
  fitAll();

  /* Start states */
  gsap.set('[data-words] .sw', { opacity: 0, yPercent: 80, rotate: 9 });
  gsap.set('[data-reveal]', { opacity: 0, y: 36 });
  $$('[data-pop]').forEach(function (el) {
    var big = el.offsetWidth > 260;
    gsap.set(el, { opacity: 0, scale: big ? 0.86 : 0.2, rotate: big ? -3 : -18 });
  });
  gsap.set('.foot__word span', { yPercent: 120, rotate: 12 });

  var heroEl = $('.hero, .shero');
  var inHero = function (el) { return heroEl && heroEl.contains(el); };
  var clear = function (targets) { gsap.set(targets, { clearProps: 'transform' }); };

  function wordsIn(el, delay) {
    var words = wordMap.get(el) || [];
    gsap.to(words, { opacity: 1, yPercent: 0, rotate: 0, duration: 0.9, ease: 'back.out(1.7)', stagger: 0.07, delay: delay || 0 });
    var marks = $$('.mark', el);
    if (marks.length) gsap.to(marks, { '--mk': 1, duration: 0.7, ease: 'power3.inOut', stagger: 0.15, delay: (delay || 0) + 0.12 });
  }
  function popIn(targets, delay) {
    gsap.to(targets, {
      opacity: 1, scale: 1, rotate: 0, duration: 1, ease: 'back.out(1.6)', stagger: 0.09, delay: delay || 0, overwrite: 'auto',
      onComplete: function () { targets.forEach(function (t) { if (!t.hasAttribute('data-depth')) clear(t); }); }
    });
  }

  /* ---------- Hero entrance ---------- */
  function heroIn() {
    if (!heroEl) return;
    $$('[data-words]', heroEl).forEach(function (el, i) { wordsIn(el, 0.1 + i * 0.2); });
    popIn($$('.pill[data-pop]', heroEl), 0);
    var reveals = $$('[data-reveal]', heroEl);
    gsap.to(reveals, { opacity: 1, y: 0, duration: 1, stagger: 0.12, delay: 0.55, onComplete: function () { clear(reveals); } });
    gsap.to($$('.strike', heroEl), { '--sx': '100%', duration: 0.7, ease: 'power3.inOut', stagger: 0.2, delay: 1.2 });
    var pops = $$('[data-pop]', heroEl).filter(function (el) { return !el.classList.contains('pill'); });
    popIn(pops, 0.3);
    var rib = $$('.ribbon', heroEl);
    if (rib.length) gsap.from(rib, { xPercent: function (i) { return i ? -110 : 110; }, duration: 1.4, ease: 'expo.out', stagger: 0.12, delay: 0.5 });
  }

  /* ---------- Intro / wipe ---------- */
  function start() {
    var hashTarget = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;

    if (root.classList.contains('is-intro') && $('.intro')) {
      try { sessionStorage.setItem('li-intro', '1'); } catch (e) {}
      if (lenis) lenis.stop();
      window.scrollTo(0, 0);
      var intro = $('.intro');
      var words = $$('.intro__word', intro);
      var tl = gsap.timeline({ onComplete: function () { root.classList.remove('is-intro'); if (lenis) lenis.start(); } });
      words.forEach(function (el, i) {
        var last = i === words.length - 1;
        var stamp = $('b', el);
        if (last) tl.to('.intro__bg--b', { scale: 16, duration: 0.7, ease: 'expo.inOut' }, '-=0.1');
        tl.fromTo(el, { opacity: 0, scale: 0.5, rotate: -8 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.42, ease: 'back.out(2)' }, last ? '-=0.35' : '>');
        tl.fromTo(stamp, { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.32, ease: 'back.out(3)' }, '-=0.1');
        if (!last) tl.to(el, { opacity: 0, y: 70, rotate: 10, duration: 0.26, ease: 'power2.in' }, '+=0.16');
        else tl.to({}, { duration: 0.45 });
      });
      tl.to(intro, { yPercent: -101, duration: 0.9, ease: 'expo.inOut' });
      tl.add(heroIn, '-=0.55');
      return;
    }

    if (root.classList.contains('is-entering')) {
      var panels = $$('.curtain i');
      gsap.set(panels, { y: 0, yPercent: 0 });
      root.classList.remove('is-entering');
      if (hashTarget) scrollToEl(hashTarget, true);
      gsap.to(panels.slice().reverse(), {
        yPercent: -101, duration: 0.75, ease: 'expo.inOut', stagger: 0.1, delay: 0.05,
        onComplete: function () { gsap.set(panels, { yPercent: 101 }); }
      });
      gsap.delayedCall(0.45, heroIn);
      return;
    }
    heroIn();
  }

  /* ---------- Scroll-in ---------- */
  var reveals = $$('[data-reveal]').filter(function (el) { return !inHero(el); });
  ScrollTrigger.batch(reveals, {
    start: 'top 90%', once: true,
    onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.07, overwrite: true, onComplete: function () { clear(batch); } }); }
  });
  var pops = $$('[data-pop]').filter(function (el) { return !inHero(el); });
  ScrollTrigger.batch(pops, { start: 'top 90%', once: true, onEnter: function (batch) { popIn(batch, 0); } });

  $$('[data-words]').filter(function (el) { return !inHero(el); }).forEach(function (el) {
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () { wordsIn(el, 0); } });
  });

  /* Sheets grow into place as they slide over the previous section */
  $$('.sheet:not(.sheet--first)').forEach(function (el) {
    gsap.fromTo(el, { scale: 0.93 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 55%', scrub: true }
    });
  });

  /* Scrubbed word colour-in */
  $$('[data-scrub]').forEach(function (el) {
    var words = splitWords(el);
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 84%', end: 'top 38%', scrub: 0.4 }
    });
  });

  /* Counters */
  $$('[data-count]').forEach(function (el) {
    var end = parseFloat(el.dataset.count);
    var o = { v: 0 };
    var small = end < 20;
    el.textContent = '0';
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: function () {
        gsap.to(o, {
          v: end, duration: small ? 1.2 : 2.4, ease: small ? 'power2.out' : 'expo.out', delay: 0.2,
          onUpdate: function () { el.textContent = fmt.format(Math.round(o.v)); }
        });
      }
    });
  });

  /* Chart tile draws itself */
  $$('[data-chart]').forEach(function (el) {
    ScrollTrigger.create({
      trigger: el, start: 'top 80%', once: true,
      onEnter: function () {
        gsap.to($('.area-line', el), { '--dr': 0, duration: 2.2, ease: 'power2.inOut', delay: 0.2 });
        gsap.to($('.area-fill', el), { '--af': 1, duration: 1.2, ease: 'power1.out', delay: 1.3 });
      }
    });
  });

  /* Road line fills as you scroll past the stops */
  var road = $('.road');
  if (road) {
    gsap.to($('.road__line i', road), {
      '--p': 1, ease: 'none',
      scrollTrigger: { trigger: road, start: 'top 70%', end: 'bottom 62%', scrub: 0.3 }
    });
  }

  /* Things that draw */
  $$('.course__no .x').forEach(function (el) {
    ScrollTrigger.create({ trigger: el, start: 'top 84%', once: true, onEnter: function () { gsap.to(el, { '--sx': '100%', duration: 0.8, ease: 'power3.inOut', delay: 0.35 }); } });
  });
  $$('.sig').forEach(function (el) {
    ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: function () { gsap.to(el, { '--mp': '0%', duration: 1.5, ease: 'power2.inOut', delay: 0.2 }); } });
  });
  $$('.mod').forEach(function (el) {
    ScrollTrigger.create({
      trigger: el, start: 'top 86%', once: true,
      onEnter: function () {
        gsap.to($('.mod__ok', el), { '--pop': 1, duration: 0.7, ease: 'back.out(2.4)', delay: 0.35 });
        gsap.to($('.mod__ok svg path', el), { '--d': 0, duration: 0.5, ease: 'power3.out', delay: 0.6 });
      }
    });
  });

  /* Brand cards scale back as the next one covers */
  var cards = $$('.bcard');
  ScrollTrigger.matchMedia({
    '(min-width: 1000px) and (min-height: 700px)': function () {
      cards.forEach(function (card, i) {
        var next = cards[i + 1];
        if (!next) return;
        gsap.to(card, { scale: 0.93, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 130px', scrub: true } });
      });
    }
  });

  /* The question bubble grows and wiggles in */
  var ask = $('.ask__bubble');
  if (ask) {
    gsap.fromTo(ask, { scale: 0.4, rotate: -10 }, {
      scale: 1, rotate: -2, ease: 'none',
      scrollTrigger: { trigger: '.ask', start: 'top 85%', end: 'top 20%', scrub: 0.5 }
    });
  }

  /* Footer wordmark: letters bounce up */
  $$('.foot__word').forEach(function (el) {
    ScrollTrigger.create({
      trigger: el, start: 'top 96%', once: true,
      onEnter: function () { gsap.to($$('span', el), { yPercent: 0, rotate: 0, duration: 1.1, ease: 'back.out(1.8)', stagger: 0.05 }); }
    });
  });

  /* Marquees */
  $$('[data-marquee]').forEach(function (m) {
    var track = $('.marquee__track', m);
    var set = $('.marquee__set', m);
    if (!track || !set) return;
    var setW = set.getBoundingClientRect().width;
    var copies = Math.max(2, Math.ceil((window.innerWidth * 2.4) / Math.max(setW, 1)) + 1);
    for (var i = 1; i < copies; i++) track.appendChild(set.cloneNode(true));
    var dir = parseFloat(m.dataset.dir) || -1;
    var x = dir > 0 ? -setW : 0;
    gsap.ticker.add(function (t, dt) {
      var v = lenis ? lenis.velocity : 0;
      x += dir * (0.06 * dt + Math.abs(v) * 0.45);
      if (x <= -setW) x += setW;
      if (x > 0) x -= setW;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
    });
    window.addEventListener('resize', function () { setW = set.getBoundingClientRect().width; });
  });

  if (fine) {
    /* Stage layers follow the mouse at different depths */
    $$('[data-stage]').forEach(function (stage) {
      var layers = $$('[data-depth]', stage).map(function (el) {
        return { d: parseFloat(el.dataset.depth) || 0, x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }) };
      });
      var host = stage.closest('section') || stage;
      host.addEventListener('mousemove', function (e) {
        var r = stage.getBoundingClientRect();
        var nx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var ny = (e.clientY - (r.top + r.height / 2)) / r.height;
        layers.forEach(function (l) { l.x(nx * l.d * 2.2); l.y(ny * l.d * 2.2); });
      });
      host.addEventListener('mouseleave', function () { layers.forEach(function (l) { l.x(0); l.y(0); }); });
    });

    /* Magnetic buttons */
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.34);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });

    /* Cursor label over the store screenshots */
    var cur = $('.cursor');
    if (cur) {
      var label = $('span', cur);
      gsap.set(cur, { x: -200, y: -200, scale: 0, opacity: 1 });
      var cx = gsap.quickTo(cur, 'x', { duration: 0.4, ease: 'power3.out' });
      var cy = gsap.quickTo(cur, 'y', { duration: 0.4, ease: 'power3.out' });
      window.addEventListener('mousemove', function (e) { cx(e.clientX); cy(e.clientY); }, { passive: true });
      $$('[data-cursor]').forEach(function (el) {
        el.addEventListener('mouseenter', function () { label.textContent = el.dataset.cursor; gsap.to(cur, { scale: 1, duration: 0.5, ease: 'back.out(2)' }); });
        el.addEventListener('mouseleave', function () { gsap.to(cur, { scale: 0, duration: 0.3, ease: 'power3.in' }); });
      });
    }
  }

  var refresh = function () { fitAll(); ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
  var rz;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(fitAll, 150); });

  window.__liReady = true;
  start();
})();
