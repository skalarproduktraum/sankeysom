# Sankey Builder

A small, self-contained interactive tool for building TAM/SAM/SOM funnel diagrams in the browser. Edit market names and values in a table; the Sankey-style flow chart updates live and can be exported as a transparent PDF or PNG, or copied straight to the clipboard.

Originally built as a Claude.ai artifact, refactored into standalone HTML/CSS/JS files.

## Files

- `sankeybuilder.html` — entry point
- `sankeybuilder.css` — styles (tokens, layout, controls)
- `sankeybuilder.js` — state, rendering, exports

## Running it

No build step. Open `sankeybuilder.html` in a browser:

```sh
open sankeybuilder.html
```

For full functionality (clipboard write requires a secure context), serve over `http://localhost`:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/sankeybuilder.html
```

The PDF export pulls jsPDF + svg2pdf.js from a CDN, so an internet connection is needed the first time.

## Features

### Market table

- Edit name, TAM, SAM, SOM (€M) per market.
- Up to 8 markets. Add, delete, or reorder rows (▲/▼).
- Per-market color via swatch / native color picker.
- Per-market enable/disable checkbox — toggles inclusion in the chart without removing the row.
- Validation badge (⚠) appears when SAM > TAM or SOM > SAM.
- All edits persist to `localStorage` across reloads.

### Chart

- Three columns (TAM → SAM → SOM) with stacked per-market segments and translucent flow connectors between them.
- Conversion percentages shown between columns.
- Long market names wrap onto multiple lines instead of getting truncated.

### Display options

- **Log scale** — toggles between log and linear column heights. Helpful when one market dominates.
- **Values dropdown** — controls how numeric values are shown:
  - *No axis* — clean look, just column totals.
  - *Axis labels* — Y-axis with 5 ticks on each column, scaled to its own total.
  - *Inline values* — per-segment values rendered inside each rectangle.
- **White labels** — switches all text to white for use on dark backgrounds. Adds a dark preview background to the on-screen chart only (not to exported files).

### Export

- **Download PDF** — vector PDF, sized to the SVG viewBox, transparent background.
- **Download PNG** — 3× resolution PNG, transparent background.
- **Copy PNG** — places the PNG on the system clipboard. Requires a secure context (`https://` or `localhost`).

The exported files always have a transparent background, regardless of the white-labels preview.

### Reset

The Reset button restores the default markets and clears all display preferences.

## Persistence

All state (markets, ordering, colors, enabled flags, scale, axis mode, white-labels) is saved to `localStorage` under the key `snk-v2`. When running embedded in Claude.ai, it also writes to `window.storage` as a fallback.
