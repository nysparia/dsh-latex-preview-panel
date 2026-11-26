# dsh-latex-preview-panel

Moves the draft LaTeX preview out of the composer and into the **Session panel**
on the right, as its own section card below the shipped sections.

Requires `dsh-math-render` (MIT) — it supplies the message-bubble math rendering
this bundle deliberately leaves alone, and its dock card is what gets hidden.

## Install

From this repository, straight into a profile:

```bash
pnpm add github:nysparia/dsh-latex-preview-panel
```

or, from a local checkout, through the harness's own installer:

```
plugin_manager({ action: "install_bundle",
                 target: "/absolute/path/to/dsh-latex-preview-panel" })
```

`private: true` keeps it off npm on purpose: it is a companion to
`dsh-math-render`, not a replacement.

## Why

`dsh-math-render@2.0.0` draws its preview in `conversation.input.dock`
(id `math-preview`) — a full-width card directly above the composer. That card
is visually the heaviest thing in the input area, and it competes with the text
you are actually typing.

## What it registers

| Seat | Id | Order | Shows |
|---|---|---|---|
| `conversation.session.panel.section` | `latex-preview` | 400 | the draft's TeX formulas |

The panel draws the section title (`LaTeX 预览`) itself and hides the whole
section — title included — when the component returns nothing, so an empty
draft costs zero space. Order 400 places it after the shipped sections:
`environment` 0, `change-requests` 100, `subagents` 200, `shared-tasks` 250,
`background-jobs` 300.

The component reads the live draft through the slot's standard `useInput`
selector (`state.draft`), so it re-renders exactly when the draft changes.

## What it hides

One rule: `.dshmr_preview{display:none}` — `dsh-math-render`'s own dock card.
The preview then exists in exactly one place. Its **message-bubble** seat
(`conversation.user.text.node`, key `math`) is untouched: formulas in messages
you send still render inline as before.

## TeX tokenizer

The tokenizer is copied verbatim from `dsh-math-render@2.0.0` (MIT,
<https://github.com/huanglianqi/dsh-math-render>). Copying is deliberate: a
preview that disagrees with the bubble renderer about what counts as math is
worse than no preview. It keeps the same refusals — fenced blocks, inline code
spans, `\$`, empty or space-padded spans, and a closing `$` glued to a digit
(so `价格 $5 和 $10` stays prose).

## Layout rules

```css
.dshmr_preview{display:none}
.latexPreview{display:flex;flex-direction:column;gap:6px;min-width:0}
.latexPreviewRow{min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;color:var(--dsw-alias-label-primary)}
.latexPreviewRow .katex{font-size:1em}
.latexPreviewRow .katex-display{margin:2px 0}
.latexPreviewRow .markdown p{margin:0}
```

A wide display formula scrolls inside its row instead of widening the panel
column, and the body variant's `1.21em` KaTeX boost is dropped the same way the
shell's `compact` variant drops it.

## Caveats

- `.dshmr_preview` is `dsh-math-render`'s internal class. If a future version
  renames it, the dock card reappears next to this section — visible, not
  broken.
- The Session panel must be open to see the card; the composer dock card it
  replaces was always visible.
- This bundle and `dsh-math-preview-compact` both restyle the same card; install
  one, not both.
