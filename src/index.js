/*!
 * bhasha-switch — one-line UI translation overlay for Indian languages.
 * Uses Google Translate as the engine, hides its default chrome, renders a
 * themeable dropdown, and persists the chosen language in localStorage.
 *
 * Usage:
 *   BhashaSwitch.init({ accent: '#2563eb', position: 'top-right' });
 */
(function (global) {
  'use strict';

  // English + all Indian regional languages Google Translate supports.
  // (Bodo/brx is omitted — Google Translate has no engine for it.)
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
    { code: 'mni-Mtei', label: 'Manipuri',  native: 'ꯃꯤꯇꯦꯏ ꯂꯣꯟ' },
    { code: 'sat',      label: 'Santali',   native: 'ᱥᱟᱱᱛᱟᱲᱤ' }
  ];

  var DEFAULTS = {
    languages: LANGUAGES,      // pass your own subset to override
    source: 'en',             // page's original language
    storageKey: 'bhasha_lang',
    position: 'top-right',    // top-right | top-left | bottom-right | bottom-left
    container: null,          // CSS selector to mount inline instead of floating
    reloadOnSwitch: false,    // true = always reload (bulletproof); false = live swap when possible
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

  function renderWidget(opts, current, onPick) {
    var wrap = document.createElement('div');
    wrap.className = 'bhasha-switch notranslate';   // notranslate: don't let Google translate our own menu
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

    var options = opts.languages.map(function (l) {
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

  var state = { opts: null, select: null };

  function applyLanguage(code) {
    var opts = state.opts;
    try { localStorage.setItem(opts.storageKey, code); } catch (e) {}

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

    var stored;
    try { stored = localStorage.getItem(opts.storageKey); } catch (e) {}
    var current = stored || opts.source;

    // Set cookie BEFORE the engine boots so a stored language auto-applies on load.
    if (current && current !== opts.source) writeGoogtrans(opts.source, current);

    function boot() {
      // Idempotent: survive double-init (e.g. React StrictMode) — never stack widgets.
      var existing = document.querySelectorAll('.bhasha-switch');
      for (var i = 0; i < existing.length; i++) existing[i].remove();
      injectHideCss();
      injectGoogle(opts.source);
      renderWidget(opts, current, applyLanguage);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  var api = { init: init, setLanguage: applyLanguage, LANGUAGES: LANGUAGES };
  global.BhashaSwitch = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
