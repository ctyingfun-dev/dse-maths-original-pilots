# Interface Direction Exploration

Status: user-selected Star-Orbit Index implemented locally; two independent visual review rounds completed.
Method: oil-ui direction exploration, followed by implementation of the selected direction.

## Confirmed Product Constraints

- A static Traditional Chinese HKDSE mathematics practice site for Papers 1 and 2, covering 2024-2026.
- Preserve the full-screen starry Mobius homepage without a header. Clicking anywhere enters Paper 1 with the selected year.
- Homepage font: user selected Fontsource Noto Sans TC, weight 300.
- Preserve questions, diagrams, hints, marking schemes, year-specific local progress, bookmarks, timed practice and PDFs.
- Keep resource navigation visible, screen questions free of blank answer spaces, and PDF answer spaces available.
- Avoid gray backgrounds, repeated questions in expanded results, generic card-heavy composition and resemblance to the previously cited DSE site.
- Preserve coordinate terminology, identity symbols, stacked fractions and visible polar-coordinate cancellation labels.
- This round implements the selected interface direction. No question content, scores, progress schema or production deployment changes.

## Observed Baseline

Evidence: `output/playwright/interface-directions/baseline-find.png`,
`baseline-control.png`, `baseline-papers.png`.

- The existing two-row header and page heading/filter area postpone the first complete question until halfway down the viewport.
- White question rows are readable, but identical horizontal bands provide little visual identity.
- The brand still uses a serif system font while the approved homepage now uses Noto Sans TC.
- A question's topic, text and hint/answer action already have a useful hierarchy; preserve that reading order.
- Visible resource links and year/paper selection are useful existing affordances.
- Long mathematical text needs a white reading field and restrained text sizes, even when surrounding navigation gains stronger character.

## Benchmark Observations

Actual 1056 x 892 browser captures, October 20, 2026:

- MathsGenie: `output/playwright/interface-directions/mathsgenie-reference.png`.
- Polypad: `output/playwright/interface-directions/mathigon-reference.png`.

These are references for educational task handling, not layouts to reproduce.

1. MathsGenie's compact top bar separates course choice from utility actions; preserve the ability to switch paper/year without visiting another page.
2. Its left navigation reserves the main width for a current task; our past user preference for visible top navigation rules out copying this sidebar.
3. Large board-choice controls give one obvious next action; our mock-paper start controls should likewise remain easy to locate.
4. Its category tiles consume substantial space before actual questions; avoid this pattern in our question bank.
5. Its bright illustrations and gradient banner serve broad course discovery; retain mathematical content as our inner-page protagonist instead.
6. Polypad's white central workspace is visually distinct from surrounding controls; use this separation for mathematical reading without making exam pages dark.
7. Its toolbar groups tools according to action and uses consistent icon shapes; use familiar icons and stable button dimensions where helpful.
8. Its category colors are functional rather than ornamental; assign color to selection and question states, preserving readable labels.
9. Its onboarding modal interrupts the workspace on first arrival; our existing content should remain directly accessible.
10. Both references are much more visually dense than the immersive homepage; the transition into a working interface should be deliberate rather than placing animated stars behind questions.

## Shared Design Intent

Users enter to find a question, start a paper, inspect a hint or compare an answer.
First-screen content must include complete actual questions. No marketing hero.
Keep the approved homepage composition and font. Use Noto Sans TC for interface
labels; mathematical notation and examination text retain suitable mathematical
and Traditional Chinese reading faces.

Energy is quiet but recognisable; alignment is precise; content density is
moderate; interface weight is light; examination language remains direct.
No fake achievements, activity statistics, unexplained icons or decorative charts.

## Direction 1: Star-Orbit Index

North star: carry the homepage's orbital identity into a bright, efficient question index.

- Structure: a compact full-width navigation band, then a narrow topic index beside an open question stream. Resource links stay visible.
- First screen: year/paper switch, search on the same compact work strip, then two complete question rows; topic filtering stays beside the text.
- Typography: Noto Sans TC 400/600 for interface, 300 for homepage; restrained 24-26px page titles, 18px questions (17px on mobile).
- Palette: starlight `#FFFFFF`, ice `#EDF7FF`, ink `#202A39`, orbital violet `#6256A7`, pale gold `#E9D8AD`, selection `#E9E5F7`.
- Selection states use violet text and a soft violet field; gold is reserved for bookmarks, not generic decoration.
- Signature: one small orbital marker locates the active navigation item; it moves only on navigation and is disabled for reduced motion.
- Controls: 4px corners, clear text labels, library icons for save/download; white reading field without floating section cards.
- Tradeoff: most closely connected to the starry entry, but long topic names need a carefully sized index on smaller screens.

## Direction 2: Geometry Catalogue

North star: make the site recognisable through the precision of a mathematical catalogue.

- Structure: one compact navigation row followed by a full-width question ledger with columns for question number, topic, content and actions.
- First screen: search and filters form the ledger's header; several complete questions appear without a separate introductory block.
- Typography: the same approved Noto Sans TC family, with stronger 600-weight topic names and aligned tabular question numbers; mathematical text stays 18px.
- Palette: white `#FFFFFF`, pale aqua `#EFFAF9`, cobalt `#245AA6`, crimson `#B63E59`, ink `#212B35`, selection `#E3EDF9`.
- Cobalt identifies navigation and current filters; crimson is limited to unfinished/error states with text labels.
- Signature: brackets group the active question's tools and reference answer, so expanding reveals support once without repeating the prompt.
- Controls: compact rectangular commands, underlined text links for secondary actions, clear column alignment; no decorative formulas.
- Tradeoff: strongest contrast with a conventional learning dashboard, but diagrams and long subparts need flexible ledger rows.

## Direction 3: Open-Paper Desk

North star: read a question and its reasoning as two facing pages.

- Structure: visible top navigation and a compact horizontal question index; a broad question column sits beside a narrower support/solution column.
- First screen: the selected question is the primary object; hints and reference answers occupy the adjacent area when opened. Mobile stacks in the same reading order.
- Typography: Noto Sans TC interface with a lighter 300-weight brand and 500-weight current topic; examination text remains 18px with generous line spacing.
- Palette: white `#FFFFFF`, pale mint `#F0FAF4`, forest `#2C6555`, rose `#A84B70`, ink `#26352F`, selection `#E0F0E7`.
- Forest identifies current actions; rose identifies bookmarks; a tinted support field distinguishes reasoning from the question.
- Signature: opening a reference answer reveals it beside the question while preserving the reading position.
- Controls: quiet 6px controls, consistent tool icons, permanently accessible question navigation, no ornamental paper textures or simulated desk objects.
- Tradeoff: best for focused practice, but a substantial information-layout change requiring careful long-answer and mobile testing.

## Selected Direction and Implementation

The user selected recommended Direction 1 for continuity with the starry homepage
and a bright mathematical reading environment. Directions 2 and 3 remain exploration
records, not alternate interfaces implemented in the product.

- Shared, screen-only CSS and a small shared presentation helper serve both papers.
- The compact header keeps year/paper choice and all resource links visible.
- A topic index filters the question stream without clearing search input; mobile uses the native topic selector.
- White paper directories align question number, topic, cancellation notices and progress states.
- Inline support preserves a single question stem. Bookmark and PDF controls use original Lucide icons.
- Motion: a 260ms orbital navigation marker, 160ms command feedback, a one-time 340ms opacity entrance, and 220ms support reveal. Reduced motion disables these.
- Existing examination wording, diagrams, marks and print styles remain unchanged.
- A failed storage write preserves in-memory work and offers the existing progress backup. The progress schema remains unchanged.
- Removed redundant year/edition eyebrows from question-bank and generic utility headings; operational labels and question metadata remain.
- Interface fonts use screen-only aliases so print font selection stays unchanged. The later Fontsource typography pass below supersedes the initial Noto Sans TC UI choice.
- Orbital position markers identify the current main/resource navigation item, selected topic, and expanded question. These are state indicators, not animated background decoration.
- Mobile resource links share one visible row. Question stems use the full reading width below their number/topic heading, retaining the 17px mathematical reading size.
- The first Paper 2 directory question at 390px now starts at y=605, approximately 91px earlier than the first review's y=696 observation.
- Removed the generic question-list heading, repeated total counts in directory headings and duplicate Paper 2 section counts; ranges, total questions in paper facts, unofficial status and marking notation remain.
- The calculator model context remains below its page title.
- Long selected topics wrap visibly over a native mobile selector instead of being truncated. Its current value remains keyboard-accessible.
- Opening Paper 1 support reveals the marking scheme in one action; requesting a hint preserves an already-open answer.
- Solution-only DOM grouping keeps balanced operations and units together where space permits, breaking at relations before splitting an operation. It preserves original nodes, fraction semantics and text. Very long expressions still wrap at narrow widths.

## Verification

- Noto Sans TC 5.3.1 original WOFF2 subsets self-hosted under `assets/fonts/noto-sans-tc/`, with OFL license.
- Font load and title fit verified at desktop and 390px mobile widths.
- The previous font-A change passed `qa-home.cjs` at all seven target sizes; this interior redesign does not change homepage behavior or animation code.
- `qa-workspace.cjs` passed on the final shared layout: Papers 1/2, years 2024-2026, 1440/1056/768/390/320px, visible cancellation labels, directory targets, navigation, timing/resume, grading progress and a single expanded stem. All six print snapshots match the pre-redesign baseline.
- The same check compares every Paper 1 answer line for 2024-2026 with its original math-rendered text, confirming that the solution grouping changes layout only.
- `qa-orbit.cjs` passed three consecutive rounds after the visual refinements: topic and search filtering, focus retention, inline support, bookmarks and answers after reload, failed writes retaining in-memory progress, backup of that progress, recovery after storage resumes, and all five widths. Reduced-motion behavior passed.
- `tmp/font-comparison-20261020/capture-orbit.cjs` verified button press feedback, the 260ms navigation transition and support reveal. It captured a supplemental video and inspected zoom reflow using 528 CSS px at 2x density for a 1056px screen.
- Oil UI static screenshot checks report `lint: []` and `issues: []` for the final desktop/mobile question bank.
- The Oil UI evidence tool's motion probe/interaction recording failed with undefined `__oilMotion` / `__oilRecordTiming`; those tool results are retained and are not counted as passing. Supplemental Playwright assertions and the separately captured recording cover the changed interactions.
- Evidence: `output/playwright/orbit-final/` (default desktop/mobile), `output/playwright/orbit/` (routes, support, reflow, motion), and `output/playwright/workspace/` (all paper views and print baselines).
- The initial deployment whitelist staged 66 reviewed website assets; the later typography pass updates it as recorded below. No deployment, push or commit performed.

## Fontsource Interior Typography

- Applied Chiron Sung HK 600 to the brand name, page titles, paper titles and section headings. Applied Chiron Hei HK 400/500/600 to navigation, topic labels, forms, hints and marking-scheme interface labels.
- Selected from the Fontsource Chiron family pages to give the existing star-orbit direction a quieter book-like title treatment and clear Hong Kong Chinese interface text. This is a typography refinement, with no new layout or motion.
- Self-hosted pinned `@fontsource/chiron-hei-hk@5.3.2` and `@fontsource-variable/chiron-sung-hk@5.3.1`, each with its original OFL license and `source.json` asset inventory. Included original subsets intersecting current UI source text; other characters retain system fallbacks.
- The Sung variable package provides TrueType bytes under upstream `.woff2` filenames. Kept those font bytes intact, named local copies `.ttf` and declared their actual format. Its weight range remains 200-900.
- Family aliases `Chiron Hei HK UI` and `Chiron Sung HK UI` are screen-only. Mathematical text, question wording, solution text, diagrams, homepage font A and PDF/print font selection are unchanged.
- Main-agent visual inspection: desktop 1056px and mobile 390px question bank. No independent review was commissioned for this local font change.
- `tmp/font-comparison-20261020/check-interior.cjs` passed both papers at 1056/390/320px for find/papers/practice, confirming actual custom glyph rendering through Chromium font diagnostics, complete long-topic labels, no page overflow and unchanged mathematical font families.
- `qa-workspace.cjs` passed both papers, all three years, five viewport widths and all six unchanged print snapshots. `git diff --check` passed.
- Evidence: `output/playwright/chiron/` contains desktop/mobile route screenshots and `font-report.json`.
- Updated the release whitelist from font inventories and locally staged 178 assets with licenses. No deployment, push or commit performed.

## Header Mark Simplification

- Replaced the book image in both interior headers with a typeset pi wordmark, using the existing mathematical serif and accent color. It is live text rather than a generated image. The brand link still leads home with the selected year.
- Replaced primary and resource navigation orbit symbols with a conventional 2px active underline and retained `aria-current`. Removed the marker-position script and its 260ms movement. Topic and expanded-question markers retain their existing styles.
- This local change supersedes the earlier header mark and navigation-motion decisions. Homepage animation, examination content, fonts and print layouts are unchanged.
- Main-agent inspection of actual screenshots at 936px and 390px; no independent review for this local change. No text removed.
- `check-brand.cjs` passed both papers at 936/390/320px, covering the wordmark, home link, active state after navigation, resource links and page overflow. Screenshots are in `output/playwright/pi-brand/`.
- `qa-workspace.cjs` passed five viewport widths and six unchanged print snapshots. `qa-orbit.cjs` passed all three rounds and reduced motion.
- Updated screen asset cache keys. No deployment, push or commit performed.

## Independent Visual Review

- Round 1: fresh reviewer, full redesign standard, **7/10**. Preserve the reading fields, mathematical type and single-stem support. Required refinements: stronger shared orbital state language, earlier mobile question access, and removal of orphaned short final lines.
- Implemented all three refinements and removed the redundant labels listed above. Functional and print checks were rerun afterward.
- Round 2: a second fresh reviewer, full redesign standard, **8/10**. Reviewers received current screenshots and constraints, not implementation code or earlier scores.
- Addressed round 2's remaining items: wrapped full selected-topic names, reduced mobile action spacing, direct marking-scheme reveal, operation-based answer wrapping, stronger existing orbital markers and removal of the repeated year/paper context from the desktop question-bank header. These final refinements were checked by the main agent rather than assigned a new score.
- Videos are captured evidence; neither the first reviewer nor this record claims that a full normal-speed playback was independently inspected.

## Frosted Glass And Plucked Ribbon

- Extended the confirmed ice-blue direction with translucent glass on the shared header, question lists, directory entries, practice reading field, tools and supporting views. Preserved the chosen fonts and the existing reading layout; the practice field remains more opaque for mathematical contrast.
- A soft radial highlight follows the mouse inside the nearest surface. A masked one-pixel border lights locally near the pointer. Decorations cannot receive clicks or obscure the content. Card perspective follows the pointer with a combined maximum of 3.6 degrees, below the requested four-degree ceiling; tall expanded cards use a smaller angle.
- Pointer exit eases the card to rest over 540ms. Scroll, resize, focus loss, cancellation, DOM replacement and preference changes clear the active effect. Coarse pointers and reduced motion retain static glass without hover animation.
- The homepage uses a ray-tested, non-rendered ribbon to detect actual pointer contact. A bounded set of damped circular string modes displaces the stars and their existing short individual trails. Empty sky does not trigger a pluck; stationary pointers do not repeatedly trigger it. The wave propagates around the ribbon and decays to the unchanged orbit. Existing anywhere-click, touch and keyboard entry remain.
- Kept the original short per-star trails: these were part of the approved homepage, show the direction of travel, and connect a star to its own preceding position rather than forming a mesh. No visible picking surface was added.
- One independent existing-interface polish review, without a score. Addressed the mobile full-page background seam by using a document-continuous background. Retained the short trails for the reason above. No redundant copy was introduced or removed.
- `qa-effects.cjs` passed three consecutive rounds: pointer light and masked border, combined tilt/reset, rerender safety, off-ribbon non-response, actual star-pixel displacement, stationary-pointer behavior and complete decay matching an unplucked control. Touch, reduced-motion and keyboard entry also passed.
- `qa-workspace.cjs` passed both papers, three years, five widths and all six unchanged print snapshots. Its snapshot ignores only the new screen-effect class name; printed colors, typography, display and geometry still match. `qa-orbit.cjs` passed three rounds of filtering, focus, hints, grading, saved progress, storage failure and backup.
- `qa-home.cjs` passed all seven viewport sizes, canvas-pixel framing/motion checks, full-screen entry, preserved years/progress, pause/resume, reduced motion, context restoration and fallback links.
- Actual desktop/mobile, practice-answer, utility-view and 200% reflow screenshots are in `output/playwright/glass/`. The same folder includes `effects-report.json`, `capture-report.json` and `glass-and-pluck.mp4`. The recording documents real-time actions; static review and frame comparisons do not constitute independent normal-speed playback review.
- Updated screen asset cache keys and prepared a new `20261020-glass` release containing 178 public assets. It supersedes the pending pi-only package. No production deployment, push or commit performed for this change.

## Gentler String Recoil

- Responded to the user's report that the first pluck felt too fast and jittery. Kept the existing star field and silhouette and tuned only the homepage contact response.
- Slowed the fundamental from 9.5 to 3.8 radians per second. Replaced six strong modes with one dominant mode and two faint overtones (relative weights 1, 0.16 and 0.02), with higher overtones damping earlier.
- Each entry onto the ribbon produces one pluck. Movement within it does not retrigger; rapid re-entry has a 1.1-second cooldown. At most two decaying plucks can coexist. The soft tail settles over 4.4 seconds, avoiding abrupt cuts.
- Three consecutive `qa-effects.cjs` rounds measured the first sign reversal at 0.832 seconds, followed by reversals near 1.664, 2.496 and 3.312 seconds. Rapid crossings no longer accumulate impacts. Rendered pixels return exactly to an unplucked control after settling; a fresh touch can pluck again.
- `qa-home.cjs` passed all seven viewport sizes, canvas rendering/movement checks, touch/keyboard/corner entry, year/progress preservation, reduced motion, context restoration and fallback links. No interior, question, print or typography changes were needed.
- This is a local motion refinement, checked by the main agent without a new independent visual review. No copy changes. Evidence: `output/playwright/glass/effects-report.json`, `home-pluck.png`, and `gentle-preview.png`.
- The local preview is running on port 4284. Cache key and prepared release are `20261020-gentle-pluck`, superseding the earlier glass package. No production deployment performed.

## Interior Spotlight Removed

- Removed the pointer-following interior radial highlight at the user's request. Kept the translucent materials, masked border highlight, bounded tilt and smooth reset. The earlier interior-highlight requirement is superseded.
- Both papers use the updated screen CSS cache key `20261020-clear-glass`. No maths, print or homepage motion changes.
- Three consecutive `qa-effects.cjs` rounds passed with an explicit assertion that the interior pseudo-element has no background image. Border masking, tilt/reset, gentle ribbon decay, mobile layout, touch and reduced motion passed.
- Release `20261020-clear-glass` includes the latest gentle homepage pluck and supersedes the previous pending packages. Deployed to the existing Cloudflare Pages production site on 2026-10-20. All 178 public files were downloaded and matched against local SHA-256 values; the live DOM confirms the new CSS key, no interior pseudo-element background, retained blur and masked border. Evidence: `tmp/publish-20261020-clear-glass-verified.json`, `tmp/cloudflare-success-20261020-clear-glass.png` and `tmp/live-clear-glass-20261020.png`.
