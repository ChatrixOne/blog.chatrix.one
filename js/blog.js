/* =====================================================================
   CHATRIX BLOG — self-contained JS
   Theme toggle · Mobile nav · Scroll reveal · Live search
===================================================================== */
(function () {
  'use strict';

  var THEME_KEY = 'chatrix:theme';
  var ROOT      = document.documentElement;
  var mql = typeof window.matchMedia === 'function'
              ? window.matchMedia('(prefers-color-scheme: dark)')
              : null;

  /* ── Theme ───────────────────────────────────────────────────────── */
  function getStored() {
    try { var v = localStorage.getItem(THEME_KEY);
          return (v === 'light' || v === 'dark') ? v : null; }
    catch (_) { return null; }
  }
  function setStored(v) {
    try { localStorage.setItem(THEME_KEY, v); } catch (_) {}
  }
  function applyTheme(t) {
    ROOT.setAttribute('data-theme', t);
  }

  function initTheme() {
    var stored = getStored();
    if (stored)                  { applyTheme(stored); }
    else if (mql && mql.matches) { applyTheme('dark');  }
    else                         { applyTheme('light'); }

    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = ROOT.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      setStored(next);
    });
    if (mql) {
      mql.addEventListener('change', function (e) {
        if (!getStored()) applyTheme(e.matches ? 'dark' : 'light');
      });
    }
  }

  /* ── Mobile nav ──────────────────────────────────────────────────── */
  function initMobileNav() {
    var btn  = document.getElementById('navHamburger');
    var menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open);
      menu.setAttribute('aria-hidden', !open);
    });
    document.addEventListener('click', function (e) {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ── Scroll reveal ───────────────────────────────────────────────── */
  function initScrollReveal() {
    /* Disabled: IntersectionObserver DOM mutations corrupt Firefox input
       state inside position:sticky elements. Cards show without animation. */
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('revealed');
    });
  }

  /* ── XMPP icon theme switching ───────────────────────────────────── */
  function initXmppIcon() {
    /* handled purely by CSS [data-theme] rules — nothing needed here */
  }

  /* ── Live search ─────────────────────────────────────────────────── */
  function initSearch() {
    var lang         = ROOT.lang || 'bg';
    var indexUrl     = lang === 'en' ? '/en/index.json' : '/index.json';
    var noResultsTxt = lang === 'en' ? 'No results found.' : 'Няма намерени резултати.';

    var inputEl     = document.getElementById('searchInput');
    var dropdown    = document.getElementById('searchDropdown');
    var resultsList = document.getElementById('searchResults');
    if (!inputEl || !dropdown || !resultsList) return;

    var index = null;
    var fetching = false;

    function loadIndex(cb) {
      if (index)    { cb(); return; }
      if (fetching) { return; }
      fetching = true;
      fetch(indexUrl)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          index = Array.isArray(data) ? data : [];
          fetching = false;
          cb();
        })
        .catch(function(err) {
          fetching = false;
          console.error('Search index failed:', err);
        });
    }

    function escRe(s) {
      return s.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&');
    }
    function highlight(text, q) {
      if (!text || !q) return text || '';
      return text.replace(new RegExp('(' + escRe(q) + ')', 'gi'), '<mark>$1</mark>');
    }

    function showDropdown() {
      dropdown.classList.add('is-open');
      dropdown.removeAttribute('aria-hidden');
    }

    function hideDropdown() {
      /* Only hide the dropdown — do NOT clear inputEl.value here,
         as that would erase keystrokes on every input event when
         fewer than 3 characters have been typed. */
      dropdown.classList.remove('is-open');
      dropdown.setAttribute('aria-hidden', 'true');
      resultsList.innerHTML = '';
    }

    function clearAndHide() {
      inputEl.value = '';
      hideDropdown();
    }

    function renderResults(q) {
      if (!index) return;
      var lower = q.toLowerCase();
      var matches = index.filter(function(p) {
        return (p.title       && p.title.toLowerCase().includes(lower))
            || (p.description && p.description.toLowerCase().includes(lower))
            || (p.content     && p.content.toLowerCase().includes(lower))
            || (p.tags        && p.tags.some(function(t) {
                 return t.toLowerCase().includes(lower);
               }));
      }).slice(0, 7);

      setTimeout(function() {
        resultsList.innerHTML = '';
        if (!matches.length) {
          resultsList.innerHTML = '<li class="search-no-results">' + noResultsTxt + '</li>';
        } else {
          matches.forEach(function(p) {
            var li = document.createElement('li');
            li.className = 'search-result-item';
            var thumb = p.image
              ? '<div class="search-result-thumb"><img src="' + p.image + '" alt="" loading="lazy"></div>'
              : '';
            var tags = (p.tags || []).slice(0, 2).map(function(t) {
              return '<span class="search-result-tag">' + t + '</span>';
            }).join('');
            li.innerHTML =
              '<a href="' + p.url + '">' +
                thumb +
                '<div class="search-result-body">' +
                  '<div class="search-result-title">' + highlight(p.title, q) + '</div>' +
                  '<div class="search-result-desc">' + (p.description || '') + '</div>' +
                  '<div class="search-result-meta">' +
                    '<span class="search-result-date">' + (p.date || '') + '</span>' +
                    tags +
                  '</div>' +
                '</div>' +
              '</a>';
            li.querySelector('a').addEventListener('click', clearAndHide);
            resultsList.appendChild(li);
          });
        }
        showDropdown();
      }, 0);
    }

    inputEl.addEventListener('input', function() {
      var q = inputEl.value.trim();
      if (q.length < 3) { hideDropdown(); return; }
      loadIndex(function() { renderResults(q); });
    });

    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') clearAndHide();
    });

    /* Use mousedown (not click) to avoid interfering with keyboard input */
    document.addEventListener('mousedown', function(e) {
      if (!inputEl.contains(e.target) && !dropdown.contains(e.target)) {
        clearAndHide();
      }
    });
  }





  /* ── XMR donate popup ────────────────────────────────────────────── */
  function initXmrPopup() {
    var trigger = document.getElementById('xmrTrigger');
    var popup   = document.getElementById('xmrPopup');
    var copyBtn = document.getElementById('xmrCopy');
    var copyLbl = document.getElementById('xmrCopyLabel');
    var address = document.getElementById('xmrAddress');
    if (!trigger || !popup) return;
    var isOpen = false;
    function positionPopup() {
      var r  = trigger.getBoundingClientRect();
      var pw = Math.min(280, window.innerWidth - 24);
      var bottom = window.innerHeight - r.top + 14;
      popup.style.width  = pw + 'px';
      popup.style.bottom = bottom + 'px';
      popup.style.top    = 'auto';
      var arrow = popup.querySelector('.xmr-popup-arrow');
      if (window.innerWidth < 600) {
        popup.style.left = '50%';
        popup.style.transform = 'translateX(-50%)';
        if (arrow) { arrow.style.left = '50%'; arrow.style.transform = 'translateX(-50%)'; }
      } else {
        popup.style.transform = '';
        var left = r.left + r.width / 2 - pw / 2;
        left = Math.max(12, Math.min(left, window.innerWidth - pw - 12));
        popup.style.left = left + 'px';
        if (arrow) {
          var ax = (r.left + r.width / 2) - left;
          ax = Math.max(20, Math.min(ax, pw - 20));
          arrow.style.left = ax + 'px';
          arrow.style.transform = 'translateX(0)';
        }
      }
    }
    function open()  { positionPopup(); popup.classList.add('is-visible'); popup.removeAttribute('aria-hidden'); isOpen = true; }
    function close() { popup.classList.remove('is-visible'); popup.setAttribute('aria-hidden', 'true'); isOpen = false; }
    trigger.addEventListener('click', function() { isOpen ? close() : open(); });
    trigger.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isOpen ? close() : open(); }
      if (e.key === 'Escape') close();
    });
    document.addEventListener('click', function(e) {
      if (isOpen && !trigger.contains(e.target) && !popup.contains(e.target)) close();
    });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && isOpen) close(); });
    window.addEventListener('resize', function() { if (isOpen) positionPopup(); });
    window.addEventListener('scroll', function() { if (isOpen) positionPopup(); }, { passive: true });
    if (copyBtn && address) {
      var isBG = document.documentElement.lang === 'bg';
      copyBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        navigator.clipboard && navigator.clipboard.writeText(address.textContent.trim()).then(function() {
          copyBtn.classList.add('copied');
          if (copyLbl) copyLbl.textContent = isBG ? 'Копирано!' : 'Copied!';
          setTimeout(function() {
            copyBtn.classList.remove('copied');
            if (copyLbl) copyLbl.textContent = isBG ? 'Копирай' : 'Copy';
          }, 2000);
        });
      });
    }
  }



  /* ── Code copy buttons ───────────────────────────────────────────── */
  function initCodeCopy() {
    var blocks = document.querySelectorAll('.prose pre');
    var isBG = document.documentElement.lang === 'bg';
    for (var i = 0; i < blocks.length; i++) {
      (function(pre) {
        var btn = document.createElement('button');
        btn.className = 'code-copy-btn';
        btn.textContent = isBG ? 'Копирай' : 'Copy';
        btn.setAttribute('aria-label', isBG ? 'Копирай кода' : 'Copy code');
        pre.appendChild(btn);
        btn.addEventListener('click', function() {
          var code = pre.querySelector('code');
          var text = code ? code.innerText : pre.innerText;
          navigator.clipboard && navigator.clipboard.writeText(text).then(function() {
            btn.textContent = isBG ? 'Копирано!' : 'Copied!';
            btn.classList.add('copied');
            setTimeout(function() {
              btn.textContent = isBG ? 'Копирай' : 'Copy';
              btn.classList.remove('copied');
            }, 2000);
          });
        });
      })(blocks[i]);
    }
  }

  /* ── Init ────────────────────────────────────────────────────────── */
  function init() {
    initTheme();
    initMobileNav();
    initScrollReveal();
    initXmppIcon();
    initSearch();
    initXmrPopup();
    initCodeCopy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

})();