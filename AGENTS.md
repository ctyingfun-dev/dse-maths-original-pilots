# Project Instructions

Read HANDOFF.md before editing this project. It contains setup, validation, deployment and device-switching procedures. Follow the user's newest instructions if they change these preferences.

## Device Switching

- GitHub origin/main is the shared source of truth. At session start, inspect git status and fetch origin. If the working tree is clean, use git pull --ff-only before editing. Never overwrite or discard uncommitted changes to obtain a clean tree.
- If devices diverge or have unfinished edits, inspect and preserve both sets of changes. Do not force-push, reset --hard or silently resolve meaningful conflicts.
- At session end, validate the requested work, commit the relevant reviewed source and documentation, and push to origin/main when the user has authorized synchronization. Verify that local HEAD equals origin/main and report any remaining local changes or authentication failures.
- Keep HANDOFF.md current when the architecture, setup, outstanding work or release state changes. A new device does not have the previous device's chat history or local skills.
- Cloudflare Production deployment is separate from source synchronization. Only deploy when requested. Stage only the public allowlist in scripts/publish.cjs; never upload the entire source repository to Cloudflare.

## Mathematics And Assessment

- Use Traditional Chinese and direct Hong Kong examination wording. Do not add fill-in-the-blank, missing-term or error-correction questions unless explicitly requested.
- Preserve the tested mathematical concepts and intended difficulty when adapting papers. Change numbers, variables and contexts meaningfully; update answers, hints, marks and diagrams together. Do not publish original examination scans.
- Use `x 坐標`, `y 坐標`, `x 軸`, `y 軸`, `x 截距`, `y 截距`. Do not use horizontal/vertical Chinese alternatives for these terms. Preserve actual axis variables such as `t 軸` or `z 截距`.
- Render identities with `≡`. All division in questions, options, hints and solutions must use stacked fractions, including nested fractions and fractional exponents; never display a division slash or division sign. Keep parallel relations distinct from division.
- Use Times New Roman for all Latin letters, digits and mathematical expressions on screen and in PDFs, including superscripts, subscripts and page numbers. Retain the existing Chinese font stacks. Do not redistribute proprietary font files; confirm actual font availability when working on a new device.
- Keep reference solutions easy to scan: separate setup, substitution, calculations and conclusions into new lines, especially the 2025 papers. Preserve all mathematics and marks; keep grouped expressions, fractions and coordinates intact when inserting line breaks.
- Every polar-coordinate question must have the adjacent visible label `已取消` in lists, practice and PDFs; retain its question and solution.
- Prefer `求 c 及 d。` over `求所有可能的有序數對 (c,d)。`. Do not restore deleted stem-and-leaf example/key lines.
- Paper 1 solutions use nonofficial DSE-style marking schemes, including method/accuracy marks. Do not add automatic marking for Paper 1.
- Keep questions single-instance when expanded. Preserve hints, marking, favourites, backups and isolated year/paper progress. Onscreen questions have no blank answer area; exported practice PDFs retain blank working space.

## Confirmed Interface

- Preserve the ice-blue glass interface, chosen typography, pi brand mark and visible resource navigation. Do not revert to previous layouts, palettes or book logo without a user request.
- Interior pointer-following radial light was explicitly cancelled. Keep glass, localized masked border lighting, bounded tilt below four degrees and smooth reset. Respect touch and reduced-motion behavior.
- Homepage is full-screen starry Mobius motion without a header or visible surface mesh. Clicking anywhere enters Paper 1 while preserving the year.
- Preserve the gentle string pluck: one response on entry, 1.1-second cooldown, dominant slow mode and decay over 4.4 seconds. Do not restore rapid repeated vibration.
- UI uses local Chiron Hei HK; headings use Chiron Sung HK; homepage uses Noto Sans TC 300; mathematical type remains separate. Screen styling must not alter print geometry or shrink PDF answer space.

## Assets And Tools

- No credentials, cookies, browser profiles, student backups, private source papers or generated debug output in commits or deployment bundles.
- The image-generation preference is the locally installed custom-openai-imagegen skill. If a new task needs generated raster art, read that skill if available. If unavailable, ask before substituting a provider or programmatic art. Do not copy credentials between devices or put them in this repository.
- Use existing code-native SVG geometry and Three.js for mathematical diagrams and the existing interactive homepage. Keep third-party licenses with fonts and vendor assets.
