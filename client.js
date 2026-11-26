/**
 * dsh-latex-preview-panel — browser half.
 *
 * `dsh-math-render@2.0.0` puts its draft TeX preview in
 * `conversation.input.dock` (id `math-preview`): a full-width card directly
 * above the composer. This bundle moves that preview into the Session panel on
 * the right, as its own section card below the shipped ones — Environment,
 * Change requests, Subagents, Shared tasks and Background jobs.
 *
 * Two parts, both reversible:
 *
 * 1. A `conversation.session.panel.section` entry, id `latex-preview`, order
 *    400 (after the shipped `background-jobs` at 300). The panel draws the
 *    section title itself and hides a section that renders nothing, so an
 *    empty draft costs no space at all.
 * 2. One stylesheet rule that hides the original dock card, `.dshmr_preview`,
 *    so the formula preview exists in exactly one place.
 *
 * The TeX tokenizer below is copied from `dsh-latex-preview-panel`'s sibling
 * `dsh-math-render@2.0.0/client.js` (MIT, https://github.com/huanglianqi/
 * dsh-math-render): the preview must agree exactly with what the bubble
 * renderer treats as math, and that agreement is the whole point of a preview.
 * It refuses the same things the shipped markdown grammar refuses —
 * fenced blocks, inline code spans, `\$`, empty or space-padded spans, and a
 * closing `$` glued to a digit, so `价格 $5 和 $10` stays prose.
 *
 * Failure mode: the section throws → the slot boundary contains it and the
 * panel shows nothing; the stylesheet alone cannot break anything.
 */

window.__ModuleLoader__.load({ id: "dsh-latex-preview-panel", factory: (require) => {
var module = { exports: {} }; var exports = module.exports

var React = require("react")
var primitives = require("@deepseek-ai/dsh-client-ui-primitives")

var MarkdownText = primitives.MarkdownText
var h = React.createElement
var useMemo = React.useMemo

/** Style tag identity, so a second mount never doubles the sheet. */
var CSS_TAG = "dsh-latex-preview-panel/styles.css"

//#region TeX tokenizer (copied from dsh-math-render@2.0.0, MIT)

/** Count the run of one repeated character starting at an index. */
function countRun(text, start, ch) {
  var i = start
  while (i < text.length && text.charAt(i) === ch) i += 1
  return i - start
}

/** Whether an index sits at the start of a line. */
function atLineStart(text, index) {
  return index === 0 || text.charAt(index - 1) === "\n"
}

/** Index just past the line that closes a fenced block opened at `start`. */
function findFenceEnd(text, start, ch, len) {
  var cursor = text.indexOf("\n", start)
  while (cursor !== -1) {
    var lineStart = cursor + 1
    if (atLineStart(text, lineStart) && text.charAt(lineStart) === ch && countRun(text, lineStart, ch) >= len) {
      var after = lineStart + countRun(text, lineStart, ch)
      var next = text.indexOf("\n", after)
      return next === -1 ? text.length : next + 1
    }
    cursor = text.indexOf("\n", cursor + 1)
  }
  return text.length
}

/** Find the closing `$` of a candidate inline-math span. */
function findInlineDollarClose(text, start) {
  var i = start
  while (i < text.length) {
    var ch = text.charAt(i)
    if (ch === "\\") {
      i += 2
      continue
    }
    if (ch === "\n" || ch === "`") return -1
    if (ch === "$") {
      var content = text.slice(start, i)
      if (content === "" || /^\s|\s$/.test(content)) return -1
      var follower = text.charAt(i + 1)
      if (follower >= "0" && follower <= "9") return -1
      return i
    }
    i += 1
  }
  return -1
}

/** Split one text into plain runs and TeX runs, in order. */
function splitMath(text) {
  var out = []
  var buffer = ""
  var bufferStart = 0
  var i = 0
  var n = typeof text === "string" ? text.length : 0

  function append(from, to) {
    if (buffer === "") bufferStart = from
    buffer += text.slice(from, to)
  }
  function flush(end) {
    if (buffer !== "") {
      out.push({ kind: "text", text: buffer, start: bufferStart, end: end })
      buffer = ""
    }
  }
  function push(kind, from, to) {
    flush(from)
    out.push({ kind: kind, text: text.slice(from, to), start: from, end: to })
  }

  while (i < n) {
    var ch = text.charAt(i)

    if ((ch === "`" || ch === "~") && atLineStart(text, i) && countRun(text, i, ch) >= 3) {
      var fenceLen = countRun(text, i, ch)
      var fenceEnd = findFenceEnd(text, i, ch, fenceLen)
      append(i, fenceEnd)
      i = fenceEnd
      continue
    }

    if (ch === "`") {
      var tickRun = countRun(text, i, "`")
      var closeTick = text.indexOf("`".repeat(tickRun), i + tickRun)
      var tickEnd = closeTick === -1 ? i + tickRun : closeTick + tickRun
      append(i, tickEnd)
      i = tickEnd
      continue
    }

    if (ch === "\\" && i + 1 < n) {
      var next = text.charAt(i + 1)
      if (next === "(") {
        var closeParen = text.indexOf("\\)", i + 2)
        if (closeParen !== -1 && text.slice(i + 2, closeParen).trim() !== "") {
          push("inline", i, closeParen + 2)
          i = closeParen + 2
          continue
        }
      } else if (next === "[") {
        var closeBracket = text.indexOf("\\]", i + 2)
        if (closeBracket !== -1 && text.slice(i + 2, closeBracket).trim() !== "") {
          push("display", i, closeBracket + 2)
          i = closeBracket + 2
          continue
        }
      }
      append(i, i + 2)
      i += 2
      continue
    }

    if (ch === "$") {
      var dollars = countRun(text, i, "$")
      if (dollars >= 2) {
        var closeBlock = text.indexOf("$$", i + 2)
        if (closeBlock !== -1 && text.slice(i + 2, closeBlock).trim() !== "") {
          push("display", i, closeBlock + 2)
          i = closeBlock + 2
          continue
        }
        append(i, i + dollars)
        i += dollars
        continue
      }
      var closeSpan = findInlineDollarClose(text, i + 1)
      if (closeSpan !== -1) {
        push("inline", i, closeSpan + 1)
        i = closeSpan + 1
        continue
      }
      append(i, i + 1)
      i += 1
      continue
    }

    append(i, i + 1)
    i += 1
  }

  flush(n)
  return out
}

/** The TeX runs of one text, in order. */
function mathRuns(text) {
  return splitMath(text).filter(function (segment) { return segment.kind !== "text" })
}

//#endregion

//#region Styles

/**
 * `.latexPreviewRow` is the only geometry this bundle owns. The first rule
 * hides `dsh-math-render`'s dock card so the preview lives in one place only;
 * the rest keeps a wide display formula scrolling inside a narrow panel
 * column instead of widening it, and drops the Markdown body variant's KaTeX
 * upsizing the same way the shell's `compact` variant does.
 */
var STYLE_TEXT = [
  ".dshmr_preview{display:none}",
  ".latexPreview{display:flex;flex-direction:column;gap:6px;min-width:0}",
  ".latexPreviewRow{min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;color:var(--dsw-alias-label-primary)}",
  ".latexPreviewRow .katex{font-size:1em}",
  ".latexPreviewRow .katex-display{margin:2px 0}",
  ".latexPreviewRow .markdown p{margin:0}"
].join("")

/** Install the stylesheet once per document. */
function installStyles() {
  if (typeof document === "undefined") return
  if (document.querySelector("style[data-plugin-css=" + JSON.stringify(CSS_TAG) + "]") !== null) return
  var tag = document.createElement("style")
  tag.setAttribute("data-plugin-css", CSS_TAG)
  tag.textContent = STYLE_TEXT
  document.head.appendChild(tag)
}

//#endregion

//#region Session panel section

/** Stable draft selector: one string, so the snapshot hook compares cheaply. */
function selectDraft(state) { return state.draft }

/**
 * The draft's TeX, rendered as a Session-panel section.
 *
 * `conversation.session.panel.section` is rendered with the session shell's
 * standard props, so `useInput` re-renders this section exactly when the draft
 * does. Returning null on a draft without TeX is what makes the section — and
 * the title the panel draws above it — disappear entirely.
 *
 * @param props - the section's render props, including `useInput`.
 * @returns the formula stack, or null when the draft holds no TeX.
 */
function LatexPreviewSection(props) {
  var owner = props !== undefined && props !== null ? props : {}
  // The slot's standard props carry `useInput`. Read it defensively: a build
  // that stopped providing it should leave the panel untouched instead of
  // throwing inside someone else's section list.
  var readDraft = owner.useInput
  var draft = typeof readDraft === "function" ? readDraft(selectDraft) : ""

  var math = useMemo(function () {
    return mathRuns(typeof draft === "string" ? draft : "")
  }, [draft])

  if (math.length === 0) return null

  return h("div", { className: "latexPreview", "data-latex-preview": "" },
    math.map(function (segment, index) {
      return h("div", {
        key: "latex" + index,
        className: "latexPreviewRow",
        "data-latex-preview-row": segment.kind
      }, h(MarkdownText, { text: segment.text }))
    })
  )
}

//#endregion

exports.name = "latex-preview"

/** Required service: the slot registry. */
exports.inject = ["slots"]

exports.apply = function apply(ctx) {
  installStyles()

  ctx.slots.inject("conversation.session.panel.section", function () {
    return ctx.slots.register({
      name: "conversation.session.panel.section",
      id: "latex-preview",
      // After the shipped sections: environment 0, change-requests 100,
      // subagents 200, shared-tasks 250, background-jobs 300.
      order: 400,
      label: "LaTeX 预览"
    }, LatexPreviewSection)
  })
}

/** Exposed for an offline check of the tokenizer and the rule text. */
exports.internals = {
  splitMath: splitMath,
  mathRuns: mathRuns,
  STYLE_TEXT: STYLE_TEXT,
  LatexPreviewSection: LatexPreviewSection
}

return module.exports; } })
