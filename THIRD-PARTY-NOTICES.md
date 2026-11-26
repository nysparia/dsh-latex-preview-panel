# Third-party notices

## dsh-math-render

- Source: <https://github.com/huanglianqi/dsh-math-render>
- Version copied: 2.0.0
- License: MIT, Copyright (c) 2026 huanglianqi

### What was copied

`client.js` reimplements this package's Session-panel section and stylesheet.
The TeX tokenizer, however, is copied verbatim, in the `#region TeX tokenizer`
block:

- `countRun`
- `atLineStart`
- `findFenceEnd`
- `findInlineDollarClose`
- `splitMath`

Copying is deliberate: a draft preview that disagrees with the bubble renderer
about what counts as math is worse than no preview. If upstream changes its
tokenizer, this copy should be refreshed from the same version.

### Why not depend on it

`dsh-math-render` exports neither its tokenizer nor its preview component, so
the only ways to reuse them are a fork of that package or this copy. A fork
would have to be re-synced on every upstream release; the copy is 154 lines and
independent of everything else in this bundle.

### Upstream license text

```
MIT License

Copyright (c) 2026 huanglianqi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
