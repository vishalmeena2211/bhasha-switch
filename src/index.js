/*!
 * bhasha-switch — one-line UI translation overlay for Indian languages.
 *
 * Two engines:
 *  - 'google' (default): uses the free Google Translate widget, hides its
 *    default chrome, renders a themeable dropdown, persists the choice.
 *  - 'custom': translates the page through YOUR server endpoint (e.g. a
 *    thin proxy over Sarvam's translate API — see examples/sarvam-server.js),
 *    with glossary support: do-not-translate terms (brands, acronyms) and
 *    per-language approved renderings for domain jargon, so "Property"
 *    can never become जायदाद (the real-estate sense) in a hotel app.
 *
 * Usage:
 *   BhashaSwitch.init({ accent: '#2563eb', position: 'top-right' });
 *   BhashaSwitch.init({
 *     engine: 'custom',
 *     translateUrl: '/api/translate',        // POST {target, texts[]} -> {results:{[src]:{t}}}
 *     glossary: {
 *       doNotTranslate: ['GST', 'UPI', 'MyBrand'],
 *       terms: { 'Property': { hi: 'प्रॉपर्टी' } }
 *     }
 *   });
 */
(function (global) {
  'use strict';

  // English + all Indian regional languages Google Translate supports.
  // (Bodo/brx is customOnly — Google Translate has no engine for it, but
  //  Sarvam's sarvam-translate:v1 does, so the custom engine offers it.)
  var LANGUAGES = [
    { code: 'en',       label: 'English',   native: 'English' },
    { code: 'hi',       label: 'Hindi',     native: 'हिन्दी' },
    { code: 'bn',       label: 'Bengali',   native: 'বাংলা' },
    { code: 'te',       label: 'Telugu',    native: 'తెలుగు' },
    { code: 'mr',       label: 'Marathi',   native: 'मराठी' },
    { code: 'ta',       label: 'Tamil',     native: 'தமிழ்' },
    { code: 'gu',       label: 'Gujarati',  native: 'ગુજરાતી' },
    { code: 'kn',       label: 'Kannada',   native: 'ಕನ್ನಡ' },
    { code: 'ml',       label: 'Malayalam', native: 'മലയാളം' },
    { code: 'pa',       label: 'Punjabi',   native: 'ਪੰਜਾਬੀ' },
    { code: 'or',       label: 'Odia',      native: 'ଓଡ଼ିଆ' },
    { code: 'as',       label: 'Assamese',  native: 'অসমীয়া' },
    { code: 'ur',       label: 'Urdu',      native: 'اردو' },
    { code: 'sa',       label: 'Sanskrit',  native: 'संस्कृतम्' },
    { code: 'ne',       label: 'Nepali',    native: 'नेपाली' },
    { code: 'sd',       label: 'Sindhi',    native: 'سنڌي' },
    { code: 'ks',       label: 'Kashmiri',  native: 'کٲشُر' },
    { code: 'gom',      label: 'Konkani',   native: 'कोंकणी' },
    { code: 'doi',      label: 'Dogri',     native: 'डोगरी' },
    { code: 'mai',      label: 'Maithili',  native: 'मैथिली' },
    { code: 'bho',      label: 'Bhojpuri',  native: 'भोजपुरी' },
    { code: 'brx',      label: 'Bodo',      native: 'बड़ो', customOnly: true },
    { code: 'mni-Mtei', label: 'Manipuri',  native: 'ꯃꯤꯇꯦꯏ ꯂꯣꯟ' },
    { code: 'sat',      label: 'Santali',   native: 'ᱥᱟᱱᱛᱟᱲᱤ' }
  ];

  var DEFAULTS = {
    languages: LANGUAGES,      // pass your own subset to override
    source: 'en',             // page's original language
    storageKey: 'bhasha_lang',
    position: 'top-right',    // top-right | top-left | bottom-right | bottom-left
    container: null,          // CSS selector to mount inline instead of floating
    reloadOnSwitch: false,    // google engine: true = always reload; custom engine ignores this
    // engine
    engine: 'google',         // 'google' | 'custom'
    translateUrl: null,       // custom engine endpoint: POST {target, texts[]} -> {results:{[src]:{t}}}
    glossary: null,           // { doNotTranslate: ['GST'], terms: { Property: { hi: 'प्रॉपर्टी' } } }
    attributes: ['placeholder', 'title', 'aria-label', 'alt'],
    batchSize: 150,
    cachePrefix: 'bhasha_cache_',
    // theme
    accent: '#2563eb',
    bg: '#ffffff',
    text: '#1a1f36',
    border: '#e2e5ea',
    radius: '10px',
    fontFamily: 'inherit',
    zIndex: 2147483000
  };

  var COOKIE = 'googtrans';

  // ------------------------------------------------------- google engine

  // source-aware cookie setter — Google reads /<source>/<target>
  function writeGoogtrans(source, code) {
    var val = '/' + source + '/' + code;
    var host = location.hostname;
    document.cookie = COOKIE + '=' + val + ';path=/';
    if (host) {
      document.cookie = COOKIE + '=' + val + ';path=/;domain=' + host;
      if (host.indexOf('.') > -1) {
        document.cookie = COOKIE + '=' + val + ';path=/;domain=.' + host;
      }
    }
  }

  function clearGoogtrans() {
    var past = ';expires=Thu, 01 Jan 1970 00:00:00 GMT';
    var host = location.hostname;
    document.cookie = COOKIE + '=' + ';path=/' + past;
    document.cookie = COOKIE + '=' + ';path=/;domain=' + host + past;
    document.cookie = COOKIE + '=' + ';path=/;domain=.' + host + past;
  }

  function injectHideCss() {
    if (document.getElementById('bhasha-hide-css')) return;
    var css =
      '.goog-te-banner-frame.skiptranslate{display:none!important;}' +
      '.goog-te-gadget{height:0;overflow:hidden;font-size:0!important;}' +
      '#bhasha-google-host{display:none!important;}' +
      'body{top:0!important;position:static!important;}' +
      '.goog-tooltip,.goog-tooltip:hover{display:none!important;}' +
      '.goog-text-highlight{background:none!important;box-shadow:none!important;}' +
      '.skiptranslate>iframe{visibility:hidden!important;height:0!important;border:0!important;}';
    var st = document.createElement('style');
    st.id = 'bhasha-hide-css';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function injectGoogle(source) {
    if (document.getElementById('bhasha-google-host')) return;
    var host = document.createElement('div');
    host.id = 'bhasha-google-host';
    document.body.appendChild(host);
    global.googleTranslateElementInit = function () {
      /* global google */
      new google.translate.TranslateElement(
        { pageLanguage: source, autoDisplay: false },
        'bhasha-google-host'
      );
    };
    var s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(s);
  }

  function tryLiveSwap(code) {
    var combo = document.querySelector('select.goog-te-combo');
    if (!combo) return false;
    combo.value = code;
    combo.dispatchEvent(new Event('change'));
    return true;
  }

  // ------------------------------------------------------------ glossary

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Build a lookup + one longest-first regex over DNT + term entries. */
  function glossaryIndex(glossary) {
    var dnt = (glossary && glossary.doNotTranslate) || [];
    var terms = (glossary && glossary.terms) || {};
    var all = [];
    var whole = {};
    var i;
    for (i = 0; i < dnt.length; i++) {
      all.push(dnt[i]);
      whole[dnt[i].toLowerCase()] = { dnt: true, term: dnt[i] };
    }
    for (var t in terms) {
      if (Object.prototype.hasOwnProperty.call(terms, t)) {
        all.push(t);
        whole[t.toLowerCase()] = { dnt: false, term: t, renderings: terms[t] };
      }
    }
    if (!all.length) return null;
    // Longest-first so "Booking.com" wins over "Booking"; word-boundary-ish
    // (a term match cannot start or end mid-word: "GST" must not match
    // "GSTIN", nor match inside "BIGGEST").
    all.sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp(
      '(?<![A-Za-z0-9])(' + all.map(escapeRegExp).join('|') + ')(?![A-Za-z0-9])',
      'gi'
    );
    return { regex: re, whole: whole };
  }

  /** Rendering for a glossary term in a target language. */
  function renderTerm(entry, lang) {
    if (!entry) return null;
    if (entry.dnt) return entry.term;
    return (entry.renderings && entry.renderings[lang]) || entry.term;
  }

  /** Replace glossary matches with «N» placeholders before the API call. */
  function protectText(text, gi) {
    var slots = [];
    if (!gi) return { out: text, slots: slots };
    var out = text.replace(gi.regex, function (m) {
      slots.push(m);
      return '«' + (slots.length - 1) + '»';
    });
    return { out: out, slots: slots };
  }

  /** Restore «N» placeholders with the approved per-language rendering. */
  function restoreText(translated, slots, lang, gi) {
    var lost = false;
    var seen = {};
    var out = translated.replace(/«\s*(\d+)\s*»/g, function (_m, d) {
      var i = parseInt(d, 10);
      if (i < 0 || i >= slots.length) return '';
      seen[i] = true;
      var entry = gi && gi.whole[slots[i].toLowerCase()];
      return renderTerm(entry, lang) || slots[i];
    });
    for (var i = 0; i < slots.length; i++) {
      if (!seen[i]) lost = true;
    }
    out = out.replace(/[«»]/g, '');
    return { text: out, lost: lost };
  }

  // ------------------------------------------------------- custom engine

  var ce = {
    originals: null,   // WeakMap node -> original text
    attrOriginals: null, // WeakMap el -> {attr: original}
    tracked: [],       // live text nodes
    trackedEls: [],    // live attribute-bearing elements
    cache: {},         // src -> translated (per active language)
    gi: null,
    observer: null,
    debounce: null
  };

  function ceSkip(el) {
    if (!el) return true;
    var tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA' || tag === 'CODE') return true;
    if (el.closest && el.closest('[translate="no"], .notranslate, .bhasha-switch, [data-bhasha-skip]')) return true;
    return false;
  }

  function ceTranslatable(text) {
    return /[A-Za-z]{2,}/.test(text || '');
  }

  function ceNormalize(s) {
    return s.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  }

  function ceLoadCache(opts, lang) {
    try {
      var raw = localStorage.getItem(opts.cachePrefix + lang);
      ce.cache = raw ? JSON.parse(raw) : {};
    } catch (e) { ce.cache = {}; }
  }

  function ceSaveCache(opts, lang) {
    try {
      localStorage.setItem(opts.cachePrefix + lang, JSON.stringify(ce.cache));
    } catch (e) { /* quota — non-fatal */ }
  }

  function ceCollect(root, opts) {
    var texts = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (ceSkip(node.parentElement)) return NodeFilter.FILTER_REJECT;
        return ceTranslatable(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      if (!ce.originals.has(n)) ce.originals.set(n, n.nodeValue);
      if (ce.tracked.indexOf(n) === -1) ce.tracked.push(n);
      texts.push(ceNormalize(ce.originals.get(n)));
    }
    var sel = opts.attributes.map(function (a) { return '[' + a + ']'; }).join(',');
    var els = (root.querySelectorAll ? root : document).querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (ceSkip(el)) continue;
      if (!ce.attrOriginals.has(el)) ce.attrOriginals.set(el, {});
      var store = ce.attrOriginals.get(el);
      for (var j = 0; j < opts.attributes.length; j++) {
        var attr = opts.attributes[j];
        var v = el.getAttribute(attr);
        if (v === null) continue;
        if (!(attr in store)) store[attr] = v;
        if (ceTranslatable(store[attr])) texts.push(ceNormalize(store[attr]));
      }
      if (ce.trackedEls.indexOf(el) === -1) ce.trackedEls.push(el);
    }
    return texts;
  }

  function ceApply(lang) {
    var i, node, orig, key, hit;
    for (i = 0; i < ce.tracked.length; i++) {
      node = ce.tracked[i];
      orig = ce.originals.get(node);
      if (orig == null) continue;
      key = ceNormalize(orig);
      hit = ce.cache[key];
      if (hit) {
        var lead = (orig.match(/^\s*/) || [''])[0];
        var trail = (orig.match(/\s*$/) || [''])[0];
        var next = lead + hit + trail;
        if (node.nodeValue !== next) node.nodeValue = next;
      }
    }
    for (i = 0; i < ce.trackedEls.length; i++) {
      var el = ce.trackedEls[i];
      var store = ce.attrOriginals.get(el) || {};
      for (var attr in store) {
        if (!Object.prototype.hasOwnProperty.call(store, attr)) continue;
        hit = ce.cache[ceNormalize(store[attr])];
        if (hit && el.getAttribute(attr) !== hit) el.setAttribute(attr, hit);
      }
    }
  }

  function ceRevert() {
    for (var i = 0; i < ce.tracked.length; i++) {
      var node = ce.tracked[i];
      var orig = ce.originals.get(node);
      if (orig != null && node.nodeValue !== orig) node.nodeValue = orig;
    }
    for (i = 0; i < ce.trackedEls.length; i++) {
      var el = ce.trackedEls[i];
      var store = ce.attrOriginals.get(el) || {};
      for (var attr in store) {
        if (Object.prototype.hasOwnProperty.call(store, attr) && el.getAttribute(attr) !== store[attr]) {
          el.setAttribute(attr, store[attr]);
        }
      }
    }
    if (ce.observer) { ce.observer.disconnect(); ce.observer = null; }
    ce.cache = {};
  }

  function ceTranslate(code, opts, done) {
    ce.gi = glossaryIndex(opts.glossary);
    ceLoadCache(opts, code);
    var texts = ceCollect(document.body, opts);
    var missing = [];
    var protectedBy = {};
    var seen = {};
    for (var i = 0; i < texts.length; i++) {
      var key = texts[i];
      if (!key || seen[key] || ce.cache[key]) continue;
      seen[key] = true;
      // whole-string glossary hit: no API call at all
      var entry = ce.gi && ce.gi.whole[key.toLowerCase()];
      if (entry) {
        ce.cache[key] = renderTerm(entry, code);
        continue;
      }
      var prot = protectText(key, ce.gi);
      protectedBy[key] = prot;
      missing.push(key);
    }
    ceApply(code);

    if (!missing.length || !opts.translateUrl) {
      ceSaveCache(opts, code);
      ceObserve(code, opts);
      if (done) done();
      return;
    }

    var batches = [];
    for (i = 0; i < missing.length; i += opts.batchSize) {
      batches.push(missing.slice(i, i + opts.batchSize));
    }
    var pending = batches.length;
    batches.forEach(function (batch) {
      fetch(opts.translateUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          target: code,
          texts: batch.map(function (k) { return protectedBy[k].out; })
        })
      }).then(function (res) {
        if (!res.ok) throw new Error('translate endpoint ' + res.status);
        return res.json();
      }).then(function (json) {
        var results = json.results || {};
        for (var j = 0; j < batch.length; j++) {
          var src = batch[j];
          var entry = results[protectedBy[src].out] || results[src];
          if (entry && entry.t) {
            ce.cache[src] = restoreText(entry.t, protectedBy[src].slots, code, ce.gi).text;
          }
        }
        ceApply(code);
      }).catch(function (err) {
        if (global.console && console.error) console.error('[bhasha-switch] translate failed:', err);
      }).then(function () {
        pending--;
        if (pending === 0) {
          ceSaveCache(opts, code);
          ceObserve(code, opts);
          if (done) done();
        }
      });
    });
  }

  function ceObserve(code, opts) {
    if (ce.observer) return;
    ce.observer = new MutationObserver(function () {
      if (ce.debounce) clearTimeout(ce.debounce);
      ce.debounce = setTimeout(function () {
        if (state.opts && state.current === code) ceTranslate(code, opts);
      }, 300);
    });
    ce.observer.observe(document.body, { childList: true, subtree: true });
  }

  // -------------------------------------------------------------- widget

  function renderWidget(opts, current, onPick) {
    var wrap = document.createElement('div');
    wrap.className = 'bhasha-switch notranslate';   // notranslate: don't let any engine translate our own menu
    wrap.setAttribute('translate', 'no');

    var floating = !opts.container;
    var posStyle = '';
    if (floating) {
      var v = opts.position.indexOf('bottom') === 0 ? 'bottom:16px;' : 'top:16px;';
      var h = opts.position.indexOf('left') > -1 ? 'left:16px;' : 'right:16px;';
      posStyle = 'position:fixed;' + v + h + 'z-index:' + opts.zIndex + ';';
    }
    wrap.style.cssText = posStyle + 'font-family:' + opts.fontFamily + ';';

    var globe =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
      'stroke="' + opts.accent + '" stroke-width="2" style="flex:0 0 auto;">' +
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18' +
      'M12 3c-2.5 2.6-2.5 15.4 0 18"/></svg>';

    var langs = opts.languages.filter(function (l) {
      return opts.engine === 'custom' ? true : !l.customOnly;
    });
    var options = langs.map(function (l) {
      var sel = l.code === current ? ' selected' : '';
      var name = l.native === l.label ? l.label : l.native + ' — ' + l.label;
      return '<option value="' + l.code + '"' + sel + '>' + name + '</option>';
    }).join('');

    wrap.innerHTML =
      '<div style="display:inline-flex;align-items:center;gap:8px;' +
        'background:' + opts.bg + ';color:' + opts.text + ';' +
        'border:1px solid ' + opts.border + ';border-radius:' + opts.radius + ';' +
        'padding:7px 10px;box-shadow:0 2px 10px rgba(16,24,40,.10);">' +
        globe +
        '<select aria-label="Select language" style="border:0;outline:0;background:transparent;' +
          'color:inherit;font:inherit;font-size:14px;cursor:pointer;appearance:none;' +
          '-webkit-appearance:none;padding-right:14px;max-width:180px;">' +
          options +
        '</select>' +
        '<span style="pointer-events:none;margin-left:-16px;color:' + opts.accent + ';">▾</span>' +
      '</div>';

    var select = wrap.querySelector('select');
    select.addEventListener('change', function () { onPick(select.value); });
    state.select = select;

    if (floating) document.body.appendChild(wrap);
    else document.querySelector(opts.container).appendChild(wrap);
    return wrap;
  }

  var state = { opts: null, select: null, current: null };

  function applyLanguage(code) {
    var opts = state.opts;
    try { localStorage.setItem(opts.storageKey, code); } catch (e) {}
    state.current = code;
    if (state.select) state.select.value = code;
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = code;
    }

    if (opts.engine === 'custom') {
      if (code === opts.source) { ceRevert(); return; }
      ceRevert();
      state.current = code;
      ceTranslate(code, opts);
      return;
    }

    if (code === opts.source) {
      clearGoogtrans();
      if (opts.reloadOnSwitch || !tryLiveSwap(code)) return location.reload();
      if (state.select) state.select.value = code;
      return;
    }
    writeGoogtrans(opts.source, code);
    if (opts.reloadOnSwitch || !tryLiveSwap(code)) return location.reload();
    if (state.select) state.select.value = code;   // keep dropdown in sync on live swap
  }

  function init(userOpts) {
    var opts = {};
    for (var k in DEFAULTS) opts[k] = DEFAULTS[k];
    for (var j in (userOpts || {})) opts[j] = userOpts[j];
    state.opts = opts;

    if (opts.engine === 'custom') {
      ce.originals = new WeakMap();
      ce.attrOriginals = new WeakMap();
      ce.tracked = [];
      ce.trackedEls = [];
    }

    var stored;
    try { stored = localStorage.getItem(opts.storageKey); } catch (e) {}
    var current = stored || opts.source;
    state.current = current;

    // Google engine: set cookie BEFORE the engine boots so a stored language
    // auto-applies on load. Custom engine applies after DOM ready instead.
    if (opts.engine !== 'custom' && current && current !== opts.source) {
      writeGoogtrans(opts.source, current);
    }

    function boot() {
      // Idempotent: survive double-init (e.g. React StrictMode) — never stack widgets.
      var existing = document.querySelectorAll('.bhasha-switch');
      for (var i = 0; i < existing.length; i++) existing[i].remove();
      if (opts.engine !== 'custom') {
        injectHideCss();
        injectGoogle(opts.source);
      }
      renderWidget(opts, current, applyLanguage);
      if (opts.engine === 'custom' && current !== opts.source) {
        ceTranslate(current, opts);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  var api = {
    init: init,
    setLanguage: applyLanguage,
    LANGUAGES: LANGUAGES,
    // exposed for tests + advanced glossary tooling
    _glossary: { index: glossaryIndex, protect: protectText, restore: restoreText, render: renderTerm }
  };
  global.BhashaSwitch = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
