---
name: Agenty Mobile
description: iPhone-first web workspace for private-endpoint chat and reviewed document edits.
colors:
  navy: "#172b48"
  bg: "#f4f6fa"
  surface: "#fff"
  text: "#172b48"
  muted: "#52647c"
  line: "#ccd7e5"
  accent: "#245bca"
  on-accent: "#fff"
  soft: "#e9effc"
  warn-bg: "#fff4d7"
  warn-text: "#6f4d08"
  err-bg: "#fff0ef"
  err-text: "#a32626"
  dark-bg: "#111b2b"
  dark-surface: "#1a283e"
  dark-text: "#e7eefb"
  dark-muted: "#b4c3db"
  dark-line: "#425574"
  dark-accent: "#a8c8ff"
  dark-on-accent: "#102341"
  dark-soft: "#233b60"
  dark-warn-bg: "#392d16"
  dark-warn-text: "#f2d38b"
  dark-err-bg: "#3b2329"
  dark-err-text: "#ffb7b2"
typography:
  headline:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(1.65rem, 5vw, 2.1rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  welcome:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(1.65rem, 6.6vw, 2rem)"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontSize: "0.94rem"
    fontWeight: 600
    lineHeight: 1.5
  field:
    fontSize: "1rem"
    lineHeight: 1.4
  label:
    fontSize: "0.88rem"
    fontWeight: 550
    lineHeight: 1.5
  helper:
    fontSize: "0.83rem"
    lineHeight: 1.5
  nav:
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  diff: "8px"
  field: "10px"
  button: "11px"
  nav: "12px"
  proposal: "14px"
  composer: "18px"
spacing:
  tight: "4px"
  small: "8px"
  action-gap: "10px"
  section-gap: "12px"
  paragraph: "16px"
  panel: "20px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 17px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 17px"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.err-text}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 17px"
  button-text:
    textColor: "{colors.accent}"
    padding: "10px 4px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.field}"
    rounded: "{rounded.field}"
    padding: "11px 13px"
  nav-active:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.nav}"
  document-block:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  proposal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.proposal}"
    padding: "20px"
  composer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.composer}"
    padding: "7px"
---

# Design System: Agenty Mobile

## Overview

**Creative North Star: "The Review Desk"**

Agenty is a restrained office workspace: a steady navy header, cool pale canvas, readable system type and cobalt actions. Its visual hierarchy keeps conversation, document content and explicit review legible without decorative imagery. This name describes the existing implementation, not a newly selected brand direction.

This is a web PWA, not a native iOS interface. Native HTML controls, Vietnamese labels, line icons and a persistent bottom navigation form the working vocabulary. The system makes permissions and revision state visible: an attached file, its destination, a consent control and labelled before/after content remain distinct from an ordinary chat reply.

**Key Characteristics:**
- Cool neutral surfaces, a constant navy header and theme-aware action colors.
- System typography and single-column, touch-oriented controls.
- Visible document scope, consent and before/after review.
- Flat working surfaces with restrained composer and modal depth.

Captured from `src/style.css`, `src/app.js`, `src/storage.js`, `PRODUCT.md` and `.impeccable/surface-briefs/app.md` on 2026-10-30. Existing screenshots `webkit-home.png`, `webkit-settings-dark.png` and `desktop.png` in `.impeccable/review/` corroborate the palette and shell. Final stylesheet cascade wins over earlier spacing in captures; no new browser or physical-iPhone verification was performed. Surface mode and the chosen chat-first composition remain in the surface brief.

## Colors

### Primary

Cobalt (`accent`) identifies primary actions, selected navigation, suggestion icons, links, caret, selection and keyboard focus. `on-accent` supplies its contrasting foreground. Dark mode changes this pair to pale blue on deep ink; it does not reuse the light-mode white foreground on pale blue.

### Neutral

`navy` anchors the header in both themes. The canvas (`bg`), working surface (`surface`), main text (`text`), secondary text (`muted`) and borders (`line`) provide the structural hierarchy. `soft` is the tinted selection, user-message and informational surface. Every `dark-*` primitive maps to the same CSS variable without the `dark-` prefix when dark mode is active.

### Status and file identity

Warning and error background/foreground pairs are separate from action colors. Their borders remain the fixed source values (`#dbc689` and `#dfb0af`) in both themes. File badges retain their own fixed identity colors: spreadsheet pale green/forest (`#e3f0e8` / `#21633e`), slide pale peach/rust (`#fff0e5` / `#95451b`), PDF pale red/brick (`#fff0ef` / `#a32626`); DOCX uses `soft` / `accent`. These are file-type labels, not additional primary accents. The declared `--success` variable has no current consumer and is not promoted to an active semantic primitive here.

The header also has fixed supporting colors for subtitle, outlined API control and configured state. These are local details rather than a second application-wide palette. “Đã nhập API” means a key is present in memory, not that connectivity has been verified.

**The Theme Pair Rule.** Change surface and foreground together through the existing CSS variables; the header and fixed file-type badge colors remain as implemented.

Theme preference is `system`, `light` or `dark`, defaulting to `system`. Explicit dark mode uses `data-theme=dark`; system dark mode requires both `data-theme=system` and the dark color-scheme media query. Component frontmatter describes light defaults; sidecar snippets use the live variables to follow either theme.

The sidecar's eight-step OKLCH ramps are synthesized swatch-panel metadata required by its format, not extracted application scales or additional approved UI colors. Canonical values and runtime theme variables remain authoritative.

## Typography

One platform stack serves headings, body, forms and preformatted review text. It resolves to the system face on Apple platforms and Segoe UI on Windows; there is no downloaded display font or separate monospace face.

- **Headline:** document and settings page titles use `headline`; the browser supplies the standard bold heading weight.
- **Welcome:** the final cascade uses `welcome` at every width, including desktop. Earlier declarations for a larger desktop welcome heading are overridden.
- **Title:** section and dialog headings use `title`.
- **Body:** root text uses `body`; messages increase line-height to (1.65), and welcome copy to (1.6). Welcome copy is limited to (50ch), empty-document copy to (45ch).
- **Controls:** buttons, field text and labels use their named roles. Native fields stay at (1rem); label and helper text are smaller rather than shrinking the editable text.
- **Navigation and metadata:** bottom labels use `nav`; message labels are (0.78rem), file metadata (0.73rem), and privacy text (0.73rem). Selected navigation and ordinary `strong` text use weight (650).

Text wraps for long filenames, endpoint URLs, notices and document content. Chat, document blocks and review text preserve whitespace; assistant messages are plain text, not a rendered Markdown or executable-content surface.

## Layout

The shell uses document scrolling, not a native tab controller. Header, centered main content and fixed bottom navigation remain shared across the three views. Main content is limited to (1000px) including horizontal padding (20px); chat, document and settings panels are limited to (780px). This stays a single-column workspace on desktop, not a sidebar/dashboard conversion.

The root reserves bottom space with `calc(82px + var(--safe-bottom))` and uses a minimum height of (100dvh). Header padding includes top, left and right safe-area insets. Navigation padding includes left/right insets and `env(safe-area-inset-bottom,0px)`; it is fixed above the bottom edge with stacking level (15). Main content itself uses fixed horizontal padding rather than independent safe-area variables.

The chat panel is a vertical flex layout. The composer area uses `margin-top:auto`; it is not independently fixed or sticky. Its mobile minimum-height calculation subtracts header/navigation allowance and safe areas; desktop uses `calc(100dvh - 180px)`. The final welcome padding is (22px) above and (14px) below, with suggestion group margins (18px 0 12px). Suggestions use bottom rules and at least (50px) height.

- **At (760px) and above:** header aligns to the centered shell, create-file options change from two to four columns, suggestions cap at (500px), document/settings top padding becomes (36px), and file actions stop stretching equally.
- **At (359px) and below:** content side padding becomes (13px), the brand subtitle disappears, and header/file-action spacing tightens.
- **Action groups:** wrap as needed with the established `action-gap`; document content is paginated (40 blocks per page), not virtualized.
- **Dialogs:** native `dialog`, width `min(620px, calc(100% - 24px))`, maximum height `calc(100dvh - 50px)`, internal scrolling and padding (22px).

Interactive controls establish a (44px) minimum target: icon controls, compact buttons, text buttons, checkbox labels and the PDF disclosure summary. Filled buttons and fields use at least (46px); bottom navigation uses (55px). Final CSS overrides also give the inline welcome “Cài đặt” button a (44px) minimum. This does not certify universal target coverage or real-device keyboard behavior.

## Elevation & Depth

The workspace is mostly flat. Borders and tonal changes separate blocks, notices, navigation selection and review content; document blocks do not carry shadows. The composer adds a very light shadow (`0 4px 12px #172b4808`). A modal adds the structural shadow (`0 16px 60px #0003`) and a dark backdrop (`#101f35a6`). These exact depth values are carried in the sidecar rather than unsupported frontmatter properties.

Keyboard focus uses an accent outline (3px) offset (3px), separate from depth. Hover treatments are enabled only under `hover:hover`: filled/outlined buttons dim through `brightness(.94)`, text/icon/suggestion controls gain a soft background, and nav labels take the accent. Header icon hover retains its fixed darker-blue fill. No custom pressed transform is implemented.

Motion is opt-in through `prefers-reduced-motion:no-preference`: buttons transition background and foreground over (150ms); review proposals reveal over (180ms) with `cubic-bezier(.16,1,.3,1)` and a clip-path change. There is no continuous animation.

## Shapes

The system uses moderately rounded controls, not full pill silhouettes. Fields, icon buttons, notices and document blocks use `field`; standard buttons use `button`; tabs, file banners and the send button use `nav`. Review containers use `proposal`, and composer/dialog use `composer`. Inset before/after regions and file marks use `diff`.

Suggestion rows are deliberately square and separated by one-pixel rules. User messages have asymmetric corners (`16px 16px 4px 16px`) and a left inset (14%); assistant messages sit on the canvas. Borders elsewhere are one pixel. The source declares `--radius:14px`, but components currently use literal radii rather than consuming that variable.

## Components

### Buttons

Filled cobalt actions carry the strongest emphasis; secondary actions are surface-colored with a line border and accent text. Destructive history deletion keeps the secondary shape but uses error text. Compact controls reduce padding without going below the implemented target. Text actions remove the border/background, and icon actions use named accessible labels with decorative inline SVGs (normally 22px).

Disabled buttons retain their shape with opacity (.55) and a wait cursor. Focus and pointer-hover behavior follow the shared rules above; there is no invented loading-spinner or custom active-state system.

### Inputs / Fields

Native inputs, textareas and selects use the working surface, main text and line border. Textareas normally resize vertically with a minimum height (80px). Checkboxes are native (21px), with an accent-colored control inside a larger clickable label. Visible labels and adjacent helper copy explain API, model, theme and history controls. Inline form errors use error text; global feedback is a polite status region.

The password field masks the API key and has an explicit show/hide text action. Endpoint, model, theme and history preference are saved; the application does not persist the API key. Optional history is off by default, limited to the latest 30 messages, stored without separate encryption and excludes attached file bytes. Do not describe this PWA storage as Keychain or secure native credential storage.

### Navigation

Three labelled button destinations remain in order: **Tài liệu / Trợ lý / Cài đặt**. The selected destination has a soft rectangular background, accent text/icon and weight (650), with `aria-current=page`. These are page-navigation buttons, not an ARIA tablist. Each has an icon above its label and maximum width (210px). A focusable skip link targets the main content.

### Composer and messages

The white/themed rounded composer groups an attachment icon, two-row prompt field and square send button (44px). Its textarea has no inner border, minimum height (66px), maximum height (200px) and no manual resize. A pending API request substitutes a stop action. Busy copy is a notice, and a privacy reminder sits below the composer. Welcome suggestions are working buttons, not feature-marketing cards.

### File banner, document blocks and notices

The file banner shows uppercase format, wrapping filename, extracted item count and original/modified state, plus an accessible document-navigation action. Document blocks place selection, block identity and edit/read-only state before text. File-type marks are not selectable filter chips; no general chip component is implemented.

Informational, warning and error notices use the same modest border and rounded shape with different semantic colors. Warnings carry real limitations: incomplete context, PDF scans, formula calculation and unavailable Office layout fidelity. Empty results do not claim that image-only or unsupported content has been read.

### Before/after review

The signature review container is separate from chat text. Each validated proposed block shows its label, **Trước** content on the canvas tone and **Sau** content on the soft tone; the labels convey meaning without relying on color. Apply and discard actions appear after the proposal and an explicit storage notice. There is one apply-all action, not per-change acceptance.

**Review before revision.** A proposal is not an applied edit; applying creates an in-memory revision, and download/share is still required to keep it outside the tab.

File consent states the included/total item count and configured destination. Selecting different blocks, opening/revising a file, or saving a changed endpoint/key resets consent as implemented. Truncated context has an explicit warning. The consent control concerns extracted document content; it does not imply that ordinary chat or provider-retained data stays on-device.

### Editing dialogs and honest capability boundaries

Native modal dialogs support block text editing and simple new-file creation. PDF controls expose ordering, rotation and text overlay, not replacement of original PDF text. Office content is a block editor, not a faithful page/slide renderer. Share uses the Web Share API where available and falls back to download, with copy telling the user to confirm the file in Files/Downloads. No native installation, successful save, verified API connection or completed full-document analysis is implied by styling alone.

## Do's and Don'ts

### Do:
- Do use paired theme variables for foregrounds, surfaces and selected actions.
- Do preserve system fonts, native form behavior, visible labels and the existing focus outline.
- Do keep the safe-area-aware shell and labelled three-destination navigation.
- Do retain explicit document scope, endpoint consent and labelled Trước/Sau review before applying AI edits.
- Do distinguish an in-memory revision from a downloaded or shared file.
- Do keep unsupported-feature and provider/CORS warnings visible where the relevant action occurs.

### Don't:
- Don't present this web PWA as SwiftUI, an IPA, App Store distribution or Keychain-backed storage.
- Don't persist API credentials or imply that optional local chat history is separately encrypted.
- Don't claim universal 44px coverage, real-iPhone validation or keyboard-safe behavior from these screenshots.
- Don't turn plain assistant replies into automatically applied edits or executable model output.
- Don't claim OCR, original PDF text replacement, Excel-equivalent recalculation or faithful Office layout rendering.
- Don't treat the API-ready header label or a successful model listing as proof that chat works.
