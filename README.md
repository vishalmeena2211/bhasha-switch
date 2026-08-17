<div align="center">

# 🌐 bhasha-switch

### Translate your entire website into any Indian language — in one line of code.

No i18n keys. No JSON files. No refactor. Drop in one script, get a beautiful language switcher, and your whole UI translates live.

[![npm version](https://img.shields.io/npm/v/bhasha-switch?color=6d28d9&label=npm)](https://www.npmjs.com/package/bhasha-switch)
[![npm downloads](https://img.shields.io/npm/dm/bhasha-switch?color=6d28d9)](https://www.npmjs.com/package/bhasha-switch)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/bhasha-switch?color=6d28d9)](https://bundlephobia.com/package/bhasha-switch)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-6d28d9)](https://www.npmjs.com/package/bhasha-switch)
[![license](https://img.shields.io/npm/l/bhasha-switch?color=6d28d9)](./LICENSE)

<br />

<img src="https://raw.githubusercontent.com/vishalmeena2211/bhasha-switch/master/assets/demo-bengali.png" alt="bhasha-switch translating a React app into Bengali" width="640" />

<sub><i>The same React page, translated to বাংলা with a single click — themeable dropdown, zero code changes.</i></sub>

</div>

---

## Why bhasha-switch?

Building for India means building for **22 official languages** and a billion people who don't read English first. Traditional i18n (`react-i18next`, `next-intl`) makes you extract every string into keys and maintain translation files forever — days of work before you ship a single word.

**bhasha-switch skips all of that.** It uses the Google Translate engine to translate your *rendered* page on the fly, hides Google's clunky default banner, and gives you a clean, themeable switcher that remembers the visitor's choice.

| | Traditional i18n | **bhasha-switch** |
|---|---|---|
| Setup time | Days (extract every string) | **1 line, 1 minute** |
| Translation files | You write & maintain them | **None** |
| Framework lock-in | Per-framework libraries | **Works anywhere** |
| New language | Add a whole locale file | **Already included** |
| Best for | Pixel-perfect product copy | **Instant reach, MVPs, content sites** |

---

## ✨ Features

- 🪶 **One line to integrate** — a `<script>` tag or a single `init()` call.
- 🇮🇳 **English + 22 Indian languages** out of the box (Hindi, Tamil, Bengali, Telugu, Marathi… full list below).
- 🎨 **Themeable dropdown** — colors, radius, position, or mount it inline in your own navbar.
- 💾 **Remembers the language** across reloads via `localStorage`.
- ⚡ **Live switching** — no full-page reload when the engine supports it (graceful reload fallback).
- 🧩 **Framework-agnostic** — React, Vue, Angular, Svelte, plain HTML. If it renders DOM, this works.
- 🪈 **Zero dependencies**, ~2 KB gzipped, no build step required.
- 🙈 **Hides Google's default banner** and prevents the page-shift it normally causes.

---

## 📦 Install

```bash
npm install bhasha-switch
```

Or use it with **zero install** via CDN:

```html
<script src="https://unpkg.com/bhasha-switch"></script>
```

---

## 🚀 Quick start

### Plain HTML

```html
<script src="https://unpkg.com/bhasha-switch"></script>
<script>
  BhashaSwitch.init({ position: 'top-right', accent: '#6d28d9' });
</script>
```

### React / Next.js

```jsx
import { useEffect } from 'react';
import BhashaSwitch from 'bhasha-switch';

export default function App() {
  useEffect(() => {
    BhashaSwitch.init({ position: 'top-right', accent: '#6d28d9', radius: '12px' });
  }, []);

  return <YourApp />;
}
```

> In **Next.js**, call it inside a `useEffect` in a client component (`'use client'`) so it runs in the browser.

### Vue 3

```js
import { onMounted } from 'vue';
import BhashaSwitch from 'bhasha-switch';

onMounted(() => BhashaSwitch.init({ accent: '#6d28d9' }));
```

That's the whole integration. A language picker appears, and your page translates on selection.

---

## ⚙️ Options

```js
BhashaSwitch.init({
  position: 'top-right',   // top-right | top-left | bottom-right | bottom-left
  accent:   '#6d28d9',     // brand color for icon + focus
  radius:   '12px',        // dropdown corner radius
  // ...see full table below
});
```

| Option           | Type            | Default          | Description |
|------------------|-----------------|------------------|-------------|
| `languages`      | `Array`         | English + 22     | Pass your own subset `[{ code, label, native }]` to trim the list |
| `source`         | `string`        | `'en'`           | The page's original language |
| `position`       | `string`        | `'top-right'`    | Corner for the floating widget |
| `container`      | `string`        | `null`           | CSS selector to mount **inline** (e.g. inside your navbar) instead of floating |
| `reloadOnSwitch` | `boolean`       | `false`          | `true` = always reload on switch (bulletproof); `false` = live swap when possible |
| `storageKey`     | `string`        | `'bhasha_lang'`  | localStorage key for the saved language |
| `accent`         | `string`        | `'#2563eb'`      | Accent color |
| `bg` / `text` / `border` | `string`| —                | Dropdown surface colors |
| `radius`         | `string`        | `'10px'`         | Dropdown border radius |
| `fontFamily`     | `string`        | `'inherit'`      | Dropdown font |
| `zIndex`         | `number`        | `2147483000`     | Stacking order for the floating widget |

---

## 🈺 Supported languages

English plus every Indian language the translation engine supports:

| | | | |
|---|---|---|---|
| 🇬🇧 English | हिन्दी Hindi | বাংলা Bengali | తెలుగు Telugu |
| मराठी Marathi | தமிழ் Tamil | ગુજરાતી Gujarati | ಕನ್ನಡ Kannada |
| മലയാളം Malayalam | ਪੰਜਾਬੀ Punjabi | ଓଡ଼ିଆ Odia | অসমীয়া Assamese |
| اردو Urdu | संस्कृतम् Sanskrit | नेपाली Nepali | سنڌي Sindhi |
| کٲشُر Kashmiri | कोंकणी Konkani | डोगरी Dogri | मैथिली Maithili |
| भोजपुरी Bhojpuri | ꯃꯤꯇꯦꯏ ꯂꯣꯟ Manipuri | ᱥᱟᱱᱛᱟᱲᱤ Santali | |

> Bodo (`brx`) is omitted in the default Google engine (no model for it) — but
> available with the custom Sarvam engine (see below), which covers all 22
> scheduled languages.

Want only a few? Pass your own list:

```js
BhashaSwitch.init({
  languages: [
    { code: 'en', label: 'English',  native: 'English' },
    { code: 'hi', label: 'Hindi',    native: 'हिन्दी' },
    { code: 'ta', label: 'Tamil',    native: 'தமிழ்' },
  ],
});
```

---

## 🇮🇳 Custom engine (Sarvam) + glossary

The Google widget is great for instant reach, but it has two hard limits: no
control over *how* things translate (a hotel app's "Property" becomes जायदाद —
the real-estate sense), and no Bodo. The **custom engine** fixes both: the
widget translates through *your* server endpoint, with a glossary that pins
brand names, acronyms, and domain jargon.

```js
BhashaSwitch.init({
  engine: 'custom',
  translateUrl: '/api/translate',   // your server endpoint (see below)
  glossary: {
    doNotTranslate: ['GST', 'UPI', 'MyBrand'],       // pass through verbatim
    terms: {
      // approved per-language renderings — the MT engine never sees these
      'Property': { hi: 'प्रॉपर्टी', ta: 'ப்ராபர்ட்டி' },
      'Check-in': { hi: 'चेक-इन' }
    }
  }
});
```

**Endpoint contract** — `POST translateUrl` with `{ target: 'hi', texts: ['...'] }`,
respond `{ results: { '<source>': { t: '<translation>' } } }`. A zero-dependency
reference implementation backed by **Sarvam AI's `sarvam-translate:v1`** (all 22
scheduled Indian languages — including Bodo, which the Google engine can't do)
is included at [`examples/sarvam-server.js`](./examples/sarvam-server.js):

```bash
SARVAM_API_KEY=sk_... node examples/sarvam-server.js
```

How the glossary works: matched terms are swapped for `«N»` placeholders
before the API call, then restored with your approved rendering afterwards —
so the engine can never dictionary-translate them. Numbers, currency, and
anything inside `translate="no"` / `.notranslate` / `data-bhasha-skip`
(names, emails — PII) are never sent anywhere. Translations are cached in
`localStorage` per language, so repeat visits are instant and cheap.

Try it locally: open [`demo-custom.html`](./demo-custom.html) via `npm test`'s
server, or point it at the Sarvam example server.

## 🧠 Programmatic API

```js
BhashaSwitch.setLanguage('ta');   // switch to Tamil from your own button
BhashaSwitch.LANGUAGES;           // the full array of supported languages
```

---

## 🔍 How it works

1. On load, it reads the saved language from `localStorage` and applies it before the engine boots — so returning visitors see their language immediately.
2. It injects the Google Translate engine but **hides its banner/gadget** with CSS and neutralizes the page-shift Google normally adds.
3. It renders its own themeable, `notranslate` dropdown (so the menu itself never gets translated).
4. On selection, it stores the choice, swaps the language live (or reloads as a fallback), and keeps the dropdown in sync.

---

## ⚠️ Honest caveats

- **Engine:** bhasha-switch is a thin, well-behaved wrapper over the **free Google Translate widget**. It's not an SLA-backed paid API — Google could change it. For mission-critical, pixel-perfect product copy (legal, financial, medical), a dedicated i18n pipeline or a paid service (Weglot, DeepL API) gives you glossary control.
- **Fidelity:** machine translation is excellent for readability but imperfect on ambiguous short labels (e.g. "Qty" vs "Amount") and may transliterate acronyms. Review critical strings.
- Numbers, dates, and currency symbols are preserved; only text is translated.
- The first translation needs a network round-trip to Google.

---

## 🗺️ Roadmap

- [ ] ESM + UMD dual build
- [x] Optional glossary / do-not-translate list *(custom engine)*
- [ ] Framework wrappers (`<BhashaSwitch />` React component)
- [x] Pluggable engines *(custom endpoint mode + Sarvam reference server; DeepL et al. work the same way)*

Contributions and issues welcome → [open an issue](https://github.com/vishalmeena2211/bhasha-switch/issues).

---

## 🤝 Contributing

PRs welcome! Clone, edit `src/index.js`, and run the demo:

```bash
git clone https://github.com/vishalmeena2211/bhasha-switch
```

---

## 📄 License

[MIT](./LICENSE) © [Vishal Meena](https://github.com/vishalmeena2211)

<div align="center"><sub>Built to make the Indian web speak everyone's language.</sub></div>
