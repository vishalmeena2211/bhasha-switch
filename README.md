# bhasha-switch

One-line UI translation overlay for **English + all Indian regional languages**. Uses Google Translate as the engine, **hides its default banner/gadget**, renders a **themeable dropdown**, and **persists the chosen language in `localStorage`**. No string extraction, no i18n keys, no build step.

## Install

```bash
npm i bhasha-switch
```

or drop it in via CDN:

```html
<script src="https://unpkg.com/bhasha-switch"></script>
```

## Use

```html
<script src="https://unpkg.com/bhasha-switch"></script>
<script>
  BhashaSwitch.init({
    position: 'top-right',   // top-right | top-left | bottom-right | bottom-left
    accent:   '#2563eb',
    radius:   '12px'
  });
</script>
```

That's the whole integration. A floating language picker appears; pick a language and the rendered page translates live. The choice survives reloads.

## Options

| Option           | Default        | What it does |
|------------------|----------------|--------------|
| `languages`      | English + 22   | Pass your own subset `[{code,label,native}]` to trim the list |
| `source`         | `'en'`         | The page's original language |
| `position`       | `'top-right'`  | Corner for the floating widget |
| `container`      | `null`         | CSS selector to mount **inline** instead of floating |
| `reloadOnSwitch` | `false`        | `true` = always reload on switch (bulletproof); `false` = live swap when possible |
| `storageKey`     | `'bhasha_lang'`| localStorage key |
| `accent`/`bg`/`text`/`border`/`radius`/`fontFamily`/`zIndex` | — | Theme the dropdown |

## Languages included

English, हिन्दी, বাংলা, తెలుగు, मराठी, தமிழ், ગુજરાતી, ಕನ್ನಡ, മലയാളം, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, অসমীয়া, اردو, संस्कृतम्, नेपाली, سنڌي, کٲشُر, कोंकणी, डोगरी, मैथिली, भोजपुरी, ꯃꯤꯇꯦꯏ ꯂꯣꯟ (Manipuri), ᱥᱟᱱᱛᱟᱲᱤ (Santali).

> Bodo (brx) is intentionally omitted — Google Translate has no engine for it.

## Programmatic control

```js
BhashaSwitch.setLanguage('ta');   // switch to Tamil
BhashaSwitch.LANGUAGES;           // the full language list
```

## Honest caveats

- **Engine = Google Translate (free, unofficial widget endpoint).** Not an SLA-backed API; Google could change it. Fidelity is machine-translation quality — great for guest-facing readability, imperfect on ambiguous short labels (e.g. "Qty" vs "Amount") and it transliterates some acronyms (CGST). For a transactional/money surface, review the risky strings.
- Numbers, dates and the ₹ symbol are left intact; only text nodes are translated.
- First translation needs a network round-trip to Google.
