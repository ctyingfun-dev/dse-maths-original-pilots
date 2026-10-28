# 2016 Source Alignment

Consolidated 2026-10-28 for parent review. This is a historical-paper adaptation record, not an official marking scheme or a certification of current syllabus coverage. **2016 has 65 questions: Paper 1 has 20 questions and 105 marks; Paper 2 has 45 questions.** Do not apply the 19-question/64-total structure of later years to this year.

This document consolidates the two author audits, two independent mathematical/source reviews and the actual 22-page Paper 2 PDF visual review. Where an author file changed after a review, that older review is not silently promoted to approval of the changed snapshot. No shared integration file was changed in preparing this document; synchronization and publication are outside this work.

## Evidence and actual reading

Primary local evidence:

- `tmp/2016-p1-source-audit.md`: Paper 1 author's source reading, question blueprints, source marks, derivations and author tests.
- `tmp/2016-p2-source-audit.md`: Paper 2 author's source reading, 45 blueprints, options, geometric contracts and tests.
- `tmp/2016-p1-independent-review.md`: separate reviewer derived all 20 answers and checked source marks/proofs. No blocking mathematical error found in its fingerprinted snapshot; it raised the old Q13 uniform scaling as an adaptation-quality concern.
- `tmp/2016-p2-independent-review.md`: separate reviewer examined all 45 questions and all 180 options against actual Chinese source pages; no actionable mathematical or source-algorithm defect found in its fingerprinted snapshot.
- `tmp/2016-p2-pdf-visual-review.md`: this consolidator actually viewed all 22 supplied final-question PDF page images and the desktop/mobile diagram contact sheets. It records three minor wrapping issues, no clipping or missing content. The parent accepted the issues; the authorized data newlines are now applied, with PDF rebuild/visual recheck still pending.
- `tmp/2016-2017-source-review/2016/manifest.json`: source paths, PDF page counts and SHA-256 fingerprints. Extracted text was a search aid, not an authority for signs, fractions or diagrams.

Source paths below are relative to the workspace parent, `C:/Users/tyf/Documents/MATH WS`.

| Source | PDF pages | SHA-256 |
|---|---:|---|
| `dse-maths-paper1-live/papers/2016.pdf` | 24 | `664dc642f96e321b3613e86f3f9553698618b462599adb94b9f40df9474bb290` |
| `dse-maths-paper1-live/papers-en/2016_Paper1_ENG.pdf` | 17 | `a53d9811f4208e553c69352932e8afd44c9000bdb40cd0b288209d5187dcfed3` |
| `dse-maths-paper1-live/marking-schemes-en/2016_Paper1_Marking_ENG.pdf` | 16 | `d6feb7876b5fc902033a8baf517777ce40c96bd891f4be3e60cd670529ae263b` |
| `Codex工作中間檔/dse-maths-paper2-live/paper2-2016/original.pdf` | 15 | `e61bd20c88dffecd92d0a14ecd2ddbb3b77e65741605068b3d435f2741f20078` |
| `Codex工作中間檔/dse-maths-paper2-live/papers-en/2016_Paper2_ENG.pdf` | 13 | `d8b08bed8014ef0ef3412c2a43d225c840d3ad84e5bc1c58a439cd0d828b6710` |

Actual visual-reading attribution matters:

- **P1 author:** Chinese pages 1–14,16–20,22; English marking-scheme pages 2–16. These include all question-bearing pages and schemes. English question text across 17 pages was read as an aid; no English question-image review was claimed.
- **P1 independent reviewer:** Chinese pages 1–24 and marking-scheme pages 1–16 actually viewed. Chinese pages 11,13,15,21,23,24 are working/end pages. Question-bearing Chinese pages are `[2,2,3,3,4,4,5,6,7,8,9,10,12,14,16,17,18,19,20,22]` for Q1–20. Scheme starting pages are `[3,3,3,4,4,5,5,5,6,7,8,9,10,11,12,12,13,13,14,15]`; Q20 continues to page16.
- **P2 author, also this consolidator:** all Chinese pages1–15 actually viewed; English images1–3 viewed, with all13 English text pages used as aids. English images4–13 were not claimed as viewed. MS1 pages1–2 were viewed for general conventions only, not to derive P1 allocations.
- **P2 independent reviewer:** all Chinese pages1–15 actually viewed, plus the full 18-figure author gallery and selected narrow screenshots.
- **This PDF review:** all `tmp/qa-pdfs-2016/2016-p2-01.png` through `2016-p2-22.png` viewed in full-page form; `tmp/qa-2016-diagrams/contact-1440.png` and `contact-320.png` also viewed. Seeing P1 thumbnails in those contacts is not a claim to have visually reviewed the P1 PDF.

## Structure, marks and figures

| Paper/section | Questions | Count | Marks/weight | Minutes |
|---|---|---:|---|---:|
| P1 甲一 | 1–9 | 9 | 35 | |
| P1 甲二 | 10–14 | 5 | 35 | |
| P1 乙部 | 15–20 | 6 | 35 | |
| **P1 total** | **1–20** | **20** | **105** | **135** |
| P2 甲部 | 1–30 | 30 | 30 equal-item normalized units | |
| P2 乙部 | 31–45 | 15 | 15 equal-item normalized units | |
| **P2 total** | **1–45** | **45** | **45 equal-item normalized units** | **75** |

The P2 original cover states equal marks, not an explicit one-mark allocation. The 45 ones below are application normalization only. Do not label them official individual marks, do not add MC method marks, and do not confuse **180 options** with total marks. P1 uses nonofficial suggested M/A/proof steps in the existing 2018 schema while preserving original question and grouped-part totals.

```json
{
  "year": 2016,
  "combinedQuestionCount": 65,
  "paper1": {
    "questionCount": 20,
    "marks": [3,3,3,4,4,4,4,5,5,5,6,7,7,10,3,3,5,6,6,12],
    "totalMarks": 105,
    "sectionCounts": [9,5,6],
    "sectionMarks": [35,35,35],
    "figureQuestionIds": [9,12,13,19],
    "figureGroupCount": 4,
    "polarQuestionIds": [7],
    "leafSubpartCounts": [0,0,0,3,0,2,3,2,2,2,2,3,3,2,0,0,2,3,2,3],
    "nestedSubparts": {
      "12": ["a","b(i)","b(ii)"],
      "13": ["a","b(i)","b(ii)"],
      "20": ["a","b(i)","b(ii)"]
    }
  },
  "paper2": {
    "questionCount": 45,
    "normalizedMarks": [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    "totalNormalizedMarks": 45,
    "sectionCounts": [30,15],
    "figureQuestionIds": [9,14,15,16,17,18,19,20,21,22,23,29,32,35,37,39,40,44],
    "figureGroupCount": 18,
    "polarQuestionIds": [],
    "nestedSubparts": {},
    "statementGroupQuestions": [15,19,27,34,36,44]
  }
}
```

P1 subpart allocation, without duplicating whole-question totals:

| Q | Source grouped marks | Leaf marks where nested |
|---|---|---|
| 4 | a1,b1,c2 | |
| 6 | a3,b1 | |
| 7 | a1,b2,c1 | |
| 8 | a3,b2 | |
| 9 | a3,b2 | |
| 10 | a2,b3 | |
| 11 | a3,b3 | |
| 12 | a3,b4 | b(i)2,b(ii)2 |
| 13 | a2,b5 | b(i)2,b(ii)3 |
| 14 | a5,b5 | |
| 17 | a2,b3 | |
| 18 | a2,b2,c2 | |
| 19 | a4,b2 | |
| 20 | a3,b9 | b(i)4,b(ii)5 |

P1 Q1,2,3,5,15,16 have no subparts. P2 Roman-numeral lists are statements inside one choice question, not separately scored subparts.

Figure-count convention is question-level groups. P1 Q9 has **two tables** inside one SVG, Q12 a bar chart, Q13 a plane figure and Q19 a tetrahedron: four groups, five table/graph objects, but only two numbered geometry figures in the original. P2 Q9 has four candidate graphs in one group; Q14 three dot patterns in one group; Q29 a table; Q44 a stem-leaf display. Thus 18 groups; separately counting the four Q9 graphs gives21 panels, and also splitting Q14's three dot patterns gives23 objects. These counts are alternatives with explicit conventions, not contradictions. Do not omit a necessary table merely because it is not a geometry drawing.

**Polar coverage:** only P1 Q7 is polar. Retain the item and solutions and display adjacent `已取消` in lists, practice and exports using the existing notice. P2 has no polar item. Q44 P2 must not acquire a stem-leaf example/key.

## Paper 1 per-question alignment

CN/MS numbers below are actual one-based source PDF pages. All rows preserve the stated core dependencies and source mark totals. The Q13 row records the current revision rather than the superseded audit data.

| Q | CN / MS | Core algorithm and conditions | Meaningful changes and checked result |
|---|---|---|---|
| 1 | 2 / 3 | Product powers; multiply indices then subtract negative exponent; positive-index answer. | Source `(x^8y^7)^2/(x^5y^-6)` becomes `(x^6y^5)^3/(x^4y^-7)`; answer x^14y^22. Nonzero domain explicit. |
| 2 | 2 / 3 | Repeated subject: expand, collect, factor and divide. | `Ax=(4x+B)C` becomes `Ax=(6x+B)C`; x=BC/(A-6C), nonsingular condition explicit. |
| 3 | 3 / 3 | Common denominator, cancellation of linear numerator terms, denominator sign reversal. | `2/(4x-5)+3/(1-6x)` becomes `3/(6x-7)+4/(5-8x)`; answer13/[(6x-7)(8x-5)]. |
| 4 | 3 / 4 | (a) common factor, (b) quadratic factorization, (c) uses both. | Source m,n and coefficients5,10,1,-6 become x,y and7,21,2,-15; final `(x-3y)(x+5y-7)`. |
| 5 | 4 / 4 | Total and relative percentage give two counts then difference. | Club membership180/40% becomes white/coloured paper inventory260/60%;160 versus100, difference60 boxes. |
| 6 | 4 / 5 | Strict lower ray OR non-strict upper ray overlaps to all reals; largest negative integer. | Thresholds -12/-5 become -8/-3; solution all reals, then -1. Both boundary conventions retained. |
| 7 | 5 / 5 | Equal polar radii and 60-degree apex imply equilateral; perimeter then rotational order. | Radius12 and75/135 degrees become radius15 and40/100; results60 degrees,45,order3. Cancellation notice required. |
| 8 | 6 / 5 | Linear-plus-quadratic variation; two values determine formula; use it in quadratic equation. | Source x²+13x becomes g=2x²+7x from g(2)=22,g(5)=85; g=60 gives4,-15/2. |
| 9 | 7 / 6 | Frequency/cumulative-table sums/differences; probability across two middle classes. | Plant heights become parcel masses; six new classes and frequencies; x8,y29,z45, probability7/15. Both tables retained. |
| 10 | 8 / 7 | Equidistance locus; axis intercepts and origin define right triangle/circle diameter; circumference comparison. | Points(5,7),(13,1) become(2,8),(10,2); locus4x-3y-9=0, diameter15/4, circumference15pi/4>11. Direct question replaces reported claim. |
| 11 | 9 / 8 | Inverted cone, no overflow; similar-volume cube ratio; radius/slant height and wetted curved area. | Milk depths12→16/addition444pi become candle wax9→15/addition294pi; V375pi, r5sqrt3, slant10sqrt3; area150pi<500. No liquid-surface area added. |
| 12 | 10 / 9 | Half-integer median forces equal lower/upper counts and two frequency pairs; add four distinct integer values with unchanged range; optimize median/mean across both cases. | Ages6–10 become manufactured lengths8–12; frequencies9,a,9,b,3 and bounds a>9,3<b<9; (a,b)=(10,7)/(11,8), max median10cm, min mean403/42cm. |
| 13 | 12 / 10 | Collinear order and equal angles/segments yield SAS; isosceles midpoint altitude; forward and converse Pythagoras. | Current JU65,KU119,UV50 replace source15,7,18. UM25,JM60,KM144,JK156,JV65,KV169; 156²+65²=169². Old scaled30,14,36 version is superseded. Proof and 2+5 mark grouping unchanged. |
| 14 | 14 / 11 | Equal remainders at opposite arguments; compare quartic factor coefficients; check discriminants of both factors. | Arguments +/-2 become +/-1; cubic7 becomes10 and factor coefficients change; l2,m-1,n-1, discriminants-32,13; exactly2 real roots. |
| 15 | 16 / 12 | Distinguishable arrangements with one category nonadjacent; gaps and factorial sample space. | 4 boys/5 girls become4 different dictionaries/6 different novels;7 gaps, probability C(7,4)4!6!/10!=1/6. |
| 16 | 17 / 12 | Recover SD from z-score, find another value, derive lower bound for range rather than exact range. | Examination scores become model-car travel distances; mean64cm,z=-2/1.5,known36; sigma14,other85,range>=49>48. |
| 17 | 18 / 13 | AP common difference; strictly positive partial sum; largest integer with excluded zero boundary. | a1=666,a38=555 become a1=540,a31=420; d=-4,S=2n(271-n),largest270; S271=0 rejected. |
| 18 | 19 / 13 | Mandated completion of square; vertical translation to x-axis tangency; y-axis reflection or equivalent translation. | p=-x²/4+10x-109; vertex(20,-9),up9 yields q=-(x-20)²/4; reflection also obtainable by left40 translation. |
| 19 | 20 / 14 | Tetrahedron; sine-rule ambiguity rejection, cosine rule; candidate plane angle invalid because one perpendicular does not imply plane-normality. | Lengths13,5,12,20 and angles82/40 replace source10,6,8,15 and86/43. Angle57.9,LM13.3; actual 3D realization verifies compatibility and rejects proposed projection. |
| 20 | 22 / 15–16 | Obtuse triangle with vertex/incentre/circumcentre collinear; prove isosceles; coordinate vertex/circle; two parallel tangents by zero discriminant; trapezium area comparison. | R(24,18),P y13 replace(40,30),19; P(9,13),circle x²+y²-48x+14y=0,r25; tangent intercepts25/4,-225/4; area15625/6>2600. Proof handles either direction of circumcentre ray. |

## Paper 2 per-question alignment

Each row is one equal-weight item with four options and a detailed worked explanation, without method marks. CN is the original Chinese page, not the exported practice-PDF page.

| Q | CN | Original core/conditions | Changed data and checked result |
|---|---:|---|---|
| 1 | 2 | Cube rewriting, exponent equalization and product of equal powers. | 8^222*5^666 becomes27^123*2^369=6^369; all huge options compared exactly. |
| 2 | 2 | Isolate x in a/x+b/y=constant. | Constant3→5; ay/(5y-b), explicit nonzero a,x,y avoids degeneracy. |
| 3 | 2 | Difference of squares and both inner sign changes. | 16-(2x-3y)² becomes25-(3x-2y)²; factors(5-3x+2y)(5+3x-2y). |
| 4 | 3 | Significant figures versus decimal-place claims. | .0765403 becomes .0487362; correct .04874 at4 significant figures; carrying now required. |
| 5 | 3 | Split chained equations and eliminate. | 4alpha+beta=7alpha+3beta=5 becomes3x+y=5x+3y=8; y=-4. |
| 6 | 3 | Factor root -1/2 then distinct remainder evaluation at -1. | Cubic4x³+kx+3 becomes8x³+kx+5; k8,remainder-11. |
| 7 | 3 | Negative-division inequality reversal and intersection of strict upper rays. | -7x>24-3x and5x-20<0; intersection x<-6. |
| 8 | 4 | Equal roots give a quadratic discriminant equation in parameter; retain both roots. | x²+kx+8k+36 becomes x²+kx+6k+28; k=-4 or28. |
| 9 | 4 | Square's opening, vertex quadrant and intercept sign across an entire parameter interval. | -1<a<0,(ax+1)²+a becomes -2<a<0,(ax+2)²+a; upward/right-below/positive intercept; graph丁. Four graphs retained. |
| 10 | 4 | Reverse two percentage comparisons with different bases. | Salaries25%/$33360 become company rents20%/$34560; third rent36000. |
| 11 | 5 | Cross-multiply ratio of linear forms with nonzero variables. | (3y-4x):(2x+y)=5:6 becomes(4y-3x):(x+2y)=3:5; x:y=7:9. |
| 12 | 5 | Direct sqrt(x), inverse y variation under percentage change. | x decrease36%,y increase60% become51%,40%; factor sqrt(.49)/1.4=.5, decrease50%. |
| 13 | 5 | Weighted total of two unit costs. | Flour3kg/2kg at42 and mean36 becomes parcel freight4kg/3kg at60 and mean48; second rate32/kg. |
| 14 | 5 | Arithmetic dot pattern with first term and increment. | First9/increment5/target7 become11/6/8; counts11,17,23 shown, answer53. |
| 15 | 6 | Parallel rays, zigzag and reflex angle; mandatory identities versus counterexamples. | Greek labels and reconstructed geometry; beta=180-alpha+gamma; onlyII. The theorem's180 constant intentionally retained. |
| 16 | 6 | Three collinear points; prove a right angle by converse Pythagoras before using it. | Lengths24,40,32,68 become15,25,20,52; KL48. No right-angle mark gives away the first inference. |
| 17 | 6 | Parallelogram plus point on side and equal sides; supplementary/isosceles angles. | Given114→122 degrees with renamed points; target64 degrees; equal KN/LN retained. |
| 18 | 7 | Right-trapezium prism: Pythagoras gives base difference, then area and volume. | 4,5,13,6 become5,7,25,8; lower base29,volume952cm³. Not substituted by triangular prism. |
| 19 | 7 | Concentric sectors; annular area determines angle; area and full sector perimeter statements. | Radii33/39,area72pi become20/28,64pi; angle60,inner area200pi/3,outer perimeter56+28pi/3; onlyI. |
| 20 | 7 | Three adjacent squares; line intersections, similarity and two trapezium areas. | Common side6 added, names changed; LS4,PT2,areas18/30; ratio3:5 necessarily dimensionless. |
| 21 | 8 | Right-angled quadrilateral; add vertical components of two slant sides using complementary trigonometric roles. | Rebuilt JKLM and alpha/beta; JM=JKcos(alpha)+KLsin(beta). Symbolic structure intentionally retained. |
| 22 | 8 | Rhombus, circle-centre vertex, three concyclic points, collinearity and chord intersection. | Given118→126; reconstructed true circle/rhombus; target angleMPN99. |
| 23 | 8 | Connected arrangement of eight regular hexagons; reflection axes rather than rotation order. | SVG rebuilt/rotated with same cell-incidence topology;2 axes. Orientation change is not claimed as a new theorem. |
| 24 | 9 | Interior-angle sum determines n; test angle and diagonal formulas. | Sum3240→2520; n16,exterior22.5,interior157.5,diagonals104. |
| 25 | 9 | Perpendicular lines intersect specifically on x-axis; first solve h, then k. | hx+ky+24=0 and3x+2y-6=0; intersection(2,0),h=-12,required perpendicular slope2/3,k18. |
| 26 | 9 | Equal distances linearize; intersect with given locus line. | Points(9,-2),(-1,8),line x-2y=0 become(10,-2),(0,8),x-3y=0; L=(3,1),requested x=3. |
| 27 | 9 | Normalize a nonmonic circle equation; centre/radius/origin-position statements. | 2x²+2y²-12x+16y+18=0 gives centre(3,-4),r4,origin distance5; onlyII/III. |
| 28 | 10 | Choose3 of4 without replacement; enumerate threshold sums. | Coins1,2,5,10 become number tiles2,4,7,12; threshold20; sums13,18,21,23; probability1/2. |
| 29 | 10 | Tabulated expectation with unequal category probabilities. | Lottery awards become component inspection times; counts2/3/5,times60/30/6; expectation24 minutes. |
| 30 | 10 | Known duplicate plus specified mode forces two unknowns; mean fixes third; median. | Shifted known values and mean67; explicit unique mode58; unknown multiset58,58,75; median72. |
| 31 | 11 | Coefficient LCM and maximum variable exponents. | 9a²b,12a⁴b³,15a⁶ become8x³y²,12x⁵y,20x²;120x⁵y². |
| 32 | 11 | Slope of x versus logarithm graph gives exponential base. | log9/intercepts(0,-2),(4,0) become log16/(0,-3),(6,0); b=16^(1/2)=4. |
| 33 | 11 | Group adjacent hexadecimal digits at their correct positional powers. | BC000DE000000 becomesAD000BE000000;173*16^11+190*16^6, exact integer check. |
| 34 | 12 | Conjugate quotients with real parameter; rationality versus reality and reciprocal imaginary parts. | 7/(a±i) becomes5/(a±2i); onlyII. a=2^(1/4) disproves universal rationality; reciprocal imaginary parts±2/5. |
| 35 | 12 | Linear objective over trapezoid bounded by two sloping and two horizontal lines. | Intercepts30,15,30,levels10/20; objective6y-4x+5; values25,-15,85,105 at J,K,L,M; maximumM. |
| 36 | 12 | GP r^4=9 admits both signs; universal irrationality and partial-sum claims. | a3=21,a7=189 become30,270; a1=10,r=±sqrt3; onlyII. Negative ratio defeats S99>4*10^24. |
| 37 | 13 | Cosine sign/amplitude and first positive maximum. | Frequency2→3,maximum2→3; a=-3,b60. “First” makes shown restriction explicit. |
| 38 | 13 | Quadratic in sine; interior sine value and boundary -1; closed0–360 interval. | 5sin²+sin-4 becomes4sin²+sin-3; sine3/4 or-1 gives3 roots; endpoints checked. |
| 39 | 13 | Cuboid, base-diagonal midpoint and point on opposite upright; distances/cosine rule then sine. | Base18x24,height12+18; sin(SPT)=7/sqrt170. New surd result; algorithm preserved, 3D coordinates independently checked. |
| 40 | 14 | Diameter, two tangents and two extended chords; exterior angle. | Tangent angle68→74,points renamed/reconstructed; angleJQK37. Tangency and all incidences checked. |
| 41 | 14 | Chord midpoint as centre's perpendicular projection onto secant; y coordinate. | Line3x-y-8=0,circle x²+y²-10y-20=0; midpoint y37/10; true secant confirmed. |
| 42 | 14 | Hypergeometric at-least2 special items in draw4; exactly2 or3 branches. | Coffee/tea9/3 become new/refurbished components8/3;92/330=46/165. Three-special-item total deliberately retained to avoid an extra branch. |
| 43 | 15 | Constrained combination sum over0,1,2 of a category. | People20/15 selecting6 become prints18/sculptures12 selecting5; at most2 sculptures; total99144. |
| 44 | 15 | Stem-leaf20 observations; upper quartile, maximum z-score and population SD statements. | Scores become processing times translated+3; Q3=73,mean66.25,var133.9875,SD11.5753,max z1.879; onlyII. No key added. |
| 45 | 15 | Variance under positive affine transformation; square scale and ignore shift. | Variance49,multiply4/add9 become variance36,multiply5/add7;25*36=900. |

## Review reconciliation and snapshot control

Two small prose slips in the independent P2 report are corrected in this consolidation without changing that reviewer's file: Q25's given-line slope is -3/2, while the required perpendicular slope is **2/3**; Q45 scales variance by **5²**, not the report's stray “6²”. The independent results k18 and variance900 were already correct. Q26 is directly an equal-distance/locus calculation; no circle construction is required by its stem.

The P1 review's uniform-scale concern refers to JU30,KU14,UV36. Current Q13 is JU65,KU119,UV50, which is not a uniform rescaling of source15,7,18. This consolidator read the current stem, all steps and diagram formula, then independently checked UM25,JM60,KM144,JK156,JV65,KV169 and the exact right-angle equality. The SAS proof, part dependencies and grouped marks remain unchanged. This local calculation resolves the numerical concern but is not a claim that the separate reviewer has re-approved the new snapshot or that its regenerated PDF has been viewed here.

The subsequently updated P1 author audit now records that revision, renewed visual reading of source MS page10, all20 verifier checks plus44 mutation tests, and regenerated1440/390/320 author galleries. It also records parent-requested prompt breaks at Q11/Q13 and the retained Q19 break. These are author checks; final independent acceptance and exported-PDF inspection remain separate.

For P2, the only change after its independent-review snapshot is an explicit newline immediately before `求` in Q32,Q37,Q39. The parent authorized this after accepting the PDF review. This author reran all45 derivations,180 options,18 diagram contracts and148 mutations successfully; the verifier needed no change. Parent has been notified that the old PDF must be rebuilt and affected pages visually checked.

SHA-256 obtained directly when consolidating:

| Current file | SHA-256 |
|---|---|
| `paper1/data-2016.js` | `74086d0a3f2055337e853c9493bc13a9cf84a99cc77de0abb30966395df7a24c` |
| `paper1/diagrams-2016.js` | `8d633ca10b77f4f41522f4ab5c0ea31a9bc908561e97fb4cf9fa931e142ca4af` |
| `verify-2016-paper1.cjs` | `4b3f6a52381ed2d950d28b472d088b9027500f12d25164b914e76535c8a23dd5` |
| `paper2/data-2016.js` | `d3a49889506e53836c27785e9e0d6684dde5763933e4249d04e395b65b6b89c7` |
| `paper2/diagrams-2016.js` | `2988c54a279195202e39562e60fce7c88c39111be7871028b0344ca39f990677` |
| `verify-2016-paper2.cjs` | `43ef6943e696609105b05009d53195adc8fdf2b9de66a4639bad73e5defbd111` |
| `output/pdf/dse-original-2016-paper2-practice.pdf` | `fbb7093138bc54bd4dcbe56d299e8f9c9e573f10dac211c003f71969b52e1b16` |

The older independent P1 snapshot was data `3dc90d33118861d9909c66f15e14b10726dcff31bf936a858c0b564bc6b3a138`, diagrams `01da7fd6a2d93a7903b1244e566719e966b947409043067e79c8599dfb274eb5`. The independent P2 data snapshot was `26d952ba7f8d646fa8bb5617fce33759768e8118fd3f46922cdd042df12abc84`; only the three authorized newlines differ from current data. P2 diagram/verifier hashes still match that review. The PDF fingerprint above identifies the pre-wrap-fix artifact, not a regenerated output. A future hash change needs proportionate rechecking, not a blanket reuse of an old PASS.

## Checks and remaining integration work

Evidence already recorded by the authors/reviewers, distinguished from fresh consolidation checks:

- P1 author verifier: all20 answers,105 marks,35 per section,231 notation strings,4 SVGs and44 rejected mutations on its recorded author snapshot. P1 independent script separately derives20 answers, checks marks and rendered division notation; covers Q12 finite cases, Q15 all210 category placements, strict AP endpoint, actual3D feasibility and Q20 tangency/area.
- P2 author verifier:45 derivations,180 options,18 diagram contracts and148 rejected mutations. Independent review separately derived45 answers and examined all180 options. Its checks cover exact huge integers, symbolic identities, universal-statement counterexamples, both GP ratio signs, combinatorial enumeration and actual circle/solid geometry.
- Fresh consolidation check against the current P1 file:20 questions, exact original marks array summing105, figure IDs9/12/13/19, and the revised Q13 exact lengths/right-angle equality all passed. This does not replace a fresh full verifier run after other changes.
- P2 PDF: all22 supplied page renders actually viewed; Q1–45 appear once and all180 choices are present. No clipping, missing figure, damaged fraction/radical or unwanted blank page found. Working gaps are intentional; page22 has only Q45 and substantial remaining working space.
- Three minor P2 export wraps were recorded: page15 Q32 isolates `b`; page18 Q37 isolates `b`; page19 Q39 separates `sin` from `∠SPT`. The parent accepted explicit prompt newlines before `求`, now applied and verified mathematically. Only the rebuilt PDF can confirm their final layout. Page9 Q19's fraction denominator3 followed by upright cm is valid and must not be treated as an error.
- Desktop1440/mobile320 contact sheets were viewed with all18 P2 groups; no obvious clipping or line/label collision found. Contact-sheet reading does not certify every full-size viewport, working-answer view or interactive flow. P1 thumbnails may predate the Q13 revision and are not final P1 PDF acceptance.

Still for parent review/integration, unless separately documented elsewhere after this snapshot:

1. Confirm revised P1 Q13 source/diagram/verifier and regenerated PDF agree, and complete the final independent check of that revision. Preserve the original proof dependency and2+5 marks.
2. Read all final P1 exported pages after the final revision. Confirm Q7's adjacent `已取消` in directory, practice, favourites and PDF; this consolidator has not personally inspected that complete PDF.
3. Rebuild P2 from the now-fixed prompt data and inspect affected prior pages15,18,19 plus neighbouring boundaries; record the new PDF fingerprint. No request to remove working space merely to reduce the page count.
4. Run current integrated year/paper loading, answer/hint/solution flows, mark layout, progress isolation, backup/restore, download and print checks. The author galleries and separate mathematical verifiers do not establish those outcomes.
5. Reconcile any future audit/report updates against current fingerprints. Current-source equality, exported-file equality and deployed-site equality are separate checks; no commit, push or deployment is claimed here.

Application contexts have been changed substantively where a contextual task exists. Pure geometry identities/topologies deliberately retain their mathematical structure; P2 Q15/Q20/Q21/Q23 and the revised P1 Q13 are disclosed rather than described as unrelated new mathematics. Arithmetic workload changes are documented; no empirical equivalence of difficulty is claimed. No fill-in-the-blank or error-correction tasks, MC method marks, duplicate whole-question totals or stem-leaf key are introduced by this consolidation.

## Final integration resolution, 2026-10-28

This section supersedes the pending integration items and author-snapshot fingerprints above.

- Revised P1 Q13 was independently re-derived: UM25, JM60, KM144, JK156, JV65, KV169; 156 squared plus 65 squared equals 169 squared. Coordinates independently realize every condition. The original proof dependency and seven marks remain intact; uniform source scaling is resolved.
- Parent visually inspected all 15 P1 pages, then re-inspected changed pages 7 and 9. The P2 reviewer viewed all 22 pages; parent regenerated the three short-request wrapping fixes and visually inspected pages 15,18,19. All question numbers, options, figures, working space and marks remain present. A later topics-page-only count fix does not change print content; P1 was regenerated from that final app version and automated PDF checks passed again.
- P1 Q7's cancellation label, exact source structure, five widths, hints/favourites, cross-year/paper progress isolation, backup/restore, single-instance stems, homepage entry and both real PDF downloads passed `qa-2016-2017.cjs`. The topics page now uses the selected question count rather than hardcoded 19.
- Both paper verifiers passed; P1 rejected44 and P2 rejected148 deliberate erroneous mutations. Three-width/print SVG checks passed, including actual Times New Roman glyphs and label/line separation. Eleven-year solution, marking, typography, workspace, marking-button and homepage regressions passed; no original-source scan is on the 226-file public allowlist.
- Final P1 PDF:15 pages, SHA256 `a0120e623f764395a48ab5ac455400ac621954aa48a7420405adae72ba34d835`. Final P2 PDF:22 pages, SHA256 `ff04aaa76440ab99e5e7bb23dbe74589cf4dd50af4a424ff84525c89da9d9a64`. Automated page bounds, fonts, formula groups, question order, marks and absence of solutions passed. Output contains blank working space, not worked answers.
- Git synchronization is recorded in HANDOFF. No Cloudflare deployment is part of this authoring task.
