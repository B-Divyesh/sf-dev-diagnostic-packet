# Visual thesis — The incident broadsheet

Diagnostic Packet looks like a careful broadsheet proof desk: evidence is set in columns, sensitive lines are struck with ink, and each artifact has an edition mark. The direction belongs to this product because debugging handoff is an editorial act—collect, verify, redact, publish—not a dashboard metric. It intentionally avoids the glowing terminals and generic gradient heroes common to developer tools.

## Palette

The public site is intentionally single-mode, like ink on stock. The background is explicitly painted; a dark theme would weaken the paper/proof metaphor.

- `paper #F2EFE6`: warm uncoated stock; page background.
- `sheet #FBF9F2`: a lifted proof sheet.
- `ink #141412`: primary copy and rules (contrast on paper 16.1:1).
- `graphite #5C5A53`: secondary copy (6.0:1 on paper).
- `signal #9D2A1E`: restrained editor's pencil for focus and important state (7.4:1 on paper).
- `safe #285B43`: successful redaction/export state (7.3:1 on paper).
- `warning #76510B`: warnings paired with labels, never color alone.
- `danger #8C2118`: failures and destructive boundaries.

Hairlines are ink at 25% opacity rather than framework-gray borders. Areas group by whitespace first and rules second.

## Type

- Display/editorial: self-hosted **FreeSerif Bold**, used for the masthead, large headline, pull quotes, and section numerals. Its high-contrast forms make the site feel printed rather than SaaS-polished.
- Utility/evidence: self-hosted **FreeSans Regular/Bold**, used for body copy and controls. Code uses the system monospace stack to keep the font payload within budget.

Fonts are copied from the Debian FreeFont package and distributed under the GNU FreeFont license; only the required Latin-facing WOFF2 files are shipped. `font-display: swap` is used.

## Scale and spacing

The base rhythm is 4px. Working steps are 8, 12, 16, 24, 32, 48, 72, and 96px. The layout is a twelve-column editorial grid above 960px and a single reading column at 390px. Display type uses a fluid 48–92px scale; body text is 17–20px with 1.55 leading and a 68-character maximum. Buttons and links have at least 44px targets with 8px separation.

The phone edition drops the side folio labels, stacks the workflow, and turns dense manifest lines into a horizontally scrollable evidence strip. It does not merely shrink the desktop page.

## Interaction grammar

- Underlines and rule shifts indicate links; controls look like labeled proof stamps, not rounded pills.
- The live demo advances through four numbered editions: preview, capture, inspect, export. State is announced in text and an `aria-live` region.
- Keyboard focus is a 3px signal-red double rule with offset. The skip link uses the same visual language.
- Copy actions immediately change their verb to “Copied” and announce the result.
- The demo is fully local and deterministic; it never reads the visitor's machine or uploads anything.

## Motion policy

Only opacity and transform animate. Section rules draw once as they enter (220ms), demo evidence moves from the manifest column to the packet column (180ms), and pressed controls move 1px like a physical stamp. Nothing loops. Under `prefers-reduced-motion: reduce`, transitions and scroll behavior become instant while hierarchy and state remain intact.

## Original asset plan and provenance

The hero image is an original editorial still life: an exploded stack of cream diagnostic sheets, black redaction bars, a folded archive envelope, and small vermilion proof marks, photographed top-down with hard newsprint texture and no readable/generated text. It explains the transformation from scattered evidence to a reviewable packet while leaving headline space.

- Generator: factory `factory-image` deployment via `/opt/fleet/lib/gen-image.sh`.
- Prompt: “Top-down editorial still life for a developer-tool landing page: an exploded stack of warm cream diagnostic papers, terminal evidence represented by precise black monospaced line patterns (no legible words), thick privacy redaction bars, configuration fingerprints, one folded archive envelope, and tiny vermilion proofreader marks. Monochrome black ink on uncoated newsprint with one restrained dark-red accent. Stark directional studio light, tactile paper fibers, high-end independent newspaper art direction, asymmetric composition with generous clean negative space at upper left. No people, no screens, no logos, no gradients, no readable text, no watermark.”
- License/ownership: generated specifically for this product; project-owned output, 2026-08-27.
- Delivery: optimized WebP, explicit dimensions, ≤300 KB; responsive derivatives where useful.

All interface marks (packet seal, redaction rules, arrows) are hand-made in CSS/HTML so they remain crisp and theme-consistent.
