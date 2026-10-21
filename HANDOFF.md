# 跨裝置交接

更新日期：2026-10-21。這份文件與 AGENTS.md 是兩部電腦共同使用的交接資料；不要依賴舊聊天記錄或某部電腦的絕對路徑。

## 現況

- 儲存庫：https://github.com/ctyingfun-dev/dse-maths-original-pilots，主要分支 `main`。
- 正式網站：https://dse-maths-original-pilots.pages.dev/，Cloudflare Pages 專案 `dse-maths-original-pilots`，Direct Upload。
- 最新正式發佈：`20261021-detailed-solutions`，網站來源提交 `e468878`。184 個公開檔案已逐一核對線上 SHA-256，包括四年份題庫、詳細解答、修正後的批改按鈕及七份 PDF。保留磨砂、局部亮邊、低於 4 度的傾斜及放慢的首頁撥動，沒有恢復內部柔光。
- 後續解答排版及全等判定修訂屬原始碼更新，**尚未部署至 Cloudflare**。最新生成規則見 `SOLUTION_STYLE.md`；下方已上架紀錄不能當作這批修訂的發佈證明。
- 正式網站及工作版本均有 2023、2024、2025、2026 四年份，共 256 題；每年卷一 19 題、卷二 45 題。資料及進度按年份／試卷隔離。
- 網站為 HTML/CSS/JavaScript 靜態檔案，無資料庫、無建置步驟；僅本機預覽需要 Node.js。字體及 Three.js 均已放在專案內。
- 網站原始碼、修改規則和工具可以同步；登入、聊天記錄、個人 skill、瀏覽器收藏／作答進度不會隨 Git 自動同步。網站本身的備份功能可匯出／匯入進度，該 JSON 不應上傳 GitHub。

## 2026-10-21 解答標準修訂（未上架）

- 已閱讀使用者提供的 `PP-DSE-MATH-CP-1-MS.pdf` 及 `2016-DSE-MATH-CP-MS-1.pdf`，只參考編排，不複製或提交參考檔。使用者最後決定是按步驟左對齊，**不用對齊等號**；先前的共用等號欄要求已取消。新算式重新起步，短結論、坐標和並列代入資料不機械拆行。
- 兩卷數學排版器保持相同，新增 `solutionLayout`／`solutionHtml`。修正多處孤立等號和缺少左端的計算續行；2023 卷一第 10(a) 題簡寫為「Γ 是 JK 的垂直平分線」，第 18 題保留短對數結論，第 19 題分清不同待求量。2025 卷一第 17 題先列判別式，再列二次公式與正整數條件，避免長根式夾在段落內。
- 所有開方用有頂線的 MathML `msqrt`；`.math-radicand` 必須是單一 `inline-block` 並保持 `white-space:nowrap`，否則內含上標／運算子時可能直排。頂線只覆蓋被開方部分，支援巢狀根號及分式；2024 卷二圖形的 `√t` 軸標亦有頂線。極長的不可拆算式允許局部橫向捲動，不逐字拆分分子、分母或根號內容。
- 全等判定使用正體 Times New Roman 的 `SAS`、`SSS`、`ASA`、`AAS`、`RHS`。2025 卷一第 8 題已改為「故 △JLN≅△KMN（ASA）。」；其他年份相關解答及兩處課題摘要同步修正，保留相等邊／角及其理由。
- `SOLUTION_STYLE.md` 是所有既有與未來年份的生成及檢查標準。AGENTS、接手指令及驗證入口已連結此文件；新增 `verify-solution-layout.cjs` 和 `qa-marking-layout.cjs`，記號測試禁止恢復中文全等判定名稱。`qa-workspace.cjs` 按完整評分步驟核對文字，容許合理換行，仍檢查內容保留。
- 驗證：256 題獨立驗算、980 項課題摘要、原題／答案鍵／選項／提示／圖形資料／配分／修訂號不變；八份試卷解答七種寬度（1440、1056、768、691、455、390、320）、根號及分式五種寬度、實際字形、手機與列印、批改／重批／計時及工作區回歸檢查全部通過。已目視檢查窄螢幕二次公式、ASA 證明及多層根式／分式截圖。
- 因共用根號渲染改動，七份練習 PDF 已重建並全部渲染檢查；不含解答，原有空白作答空間保留。2023 卷一／二為 14／21 頁、2024 為 15／21 頁、2025 為 14／21 頁、2026 卷一為 13 頁。
- 原始碼內容指紋（文字換行正規化）：`c13fe2d3af69ec4585dc6026c523d7b98e6c4c11e4f07525baa3e2576b8f8176`。正式網站仍以上述 `20261021-detailed-solutions` 為準，不可沿用舊 Cloudflare 上傳頁內的檔案當作新發佈。

### 2022 待辦與保留草稿

使用者較早要求加入／上架 2022，但其後優先處理解答排版。本機保留被 Git 忽略的 `paper1/data-2022.js`（19 題）及 `paper2/data-2022.js`（45 題）。它們未納入網站、Git 或公開 allowlist，尚無完整圖形、年份整合、驗證及 PDF，**不得直接發佈**，也不會自動出現在另一部電腦。不要刪除或覆蓋草稿；接續時先與這部電腦的檔案比對。

已知未完成的驗算：卷一第 11 題移除 18／46 後的總和與平方和應為 587／19129、559／17337，標準差約 7.232199／6.846557，最大為 7.23 歲；第 17 題邊界約 285.1140404，答案 286；第 18 題 KL 約 37.8048973、相關角約 33.1644917°、JM 約 15.9749002、仰角約 34.6960005°，須補完整結論。卷二第 11 題補複利結果 8618，第 16 題補大弓形面積約 392 cm²，第 17 題直接寫四邊形 JMNL 面積為 77 cm²，第 30 題方差應為 5.25、3.75、7.5。第 40 題立方體頂點讀圖及解答仍有疑點，必須重新閱讀私有原卷完整圖形，不可相信現有草稿。原卷及暫存圖只留本機，不提交或部署。

## 2026-10-21 修改（已上架）

- 2023–2026 兩卷共 256 題的參考解答已全部擴充，列出公式／原理、代入數值、中間運算及結論。原題、答案、提示、選項、圖形及配分均保留；卷一繼續使用原有 M/A 評分參考，卷二沒有新增虛構配分。新年份也須遵守 AGENTS.md 的詳細解答要求。
- 數值後的 g 及重量／質量單位 g 改為正體，代數變數或函數 g 仍斜體；兩套數學排版器同步修正。
- 卷一 PDF 只顯示完整的分題配分，不重複題末全題總分；沒有分題的題目保留唯一總分。缺少分題標記時從既有評分參考補算，合計必須等於原題分數。四份 PDF 已重建，作答空間尺寸及數量保留；2023/2024/2025/2026 分別為 14/15/14/13 頁。
- 卷二逐題批改按鈕曾被共用磨砂樣式改成白底白字，現已修正正常及停用狀態的對比。整卷「對答案」在練習頁頂部和底部顯示，直接進入網址或重新選答案後也能批改；空白試卷不會誤完成。原有計時提交行為保留。
- 已完成 256 題獨立驗算、原題／配分完整性比對、用語及分數渲染檢查、解答五種寬度檢查，以及四年份按鈕、重批、進度保留、計時和手機版測試。`qa-check-answers.cjs` 加入按鈕對比回歸檢查；`build-paper1-pdf.cjs` 加入列印配分合計、無重複總分和作答區尺寸斷言。四份新 PDF 已渲染檢查，其餘三份 PDF 亦通過原有驗證。
- 網站內容指紋（文字換行正規化）：`fbe6644fac2825d1a810560f81bd578dbd062ae5253fb0d9fe145ced7d1fa12f`。已按使用者「上架」要求部署至既有 Cloudflare Production 專案，184 檔比對及線上四年份批改、重批、手機版測試通過。核對紀錄在 `tmp/publish-20261021-detailed-solutions-verified.json`，成功畫面在 `tmp/cloudflare-published-20261021.jpg`；這些本機暫存檔不提交。本節優先於下方歷史紀錄。

## 開始在另一部電腦工作

1. 準備 Git 和 Node.js 22 或以上。若要推送修改，用自己的 GitHub 登入方式取得此儲存庫寫入權限，不複製舊電腦的 token 或瀏覽器 cookie。
2. 初次使用執行：

```sh
git clone https://github.com/ctyingfun-dev/dse-maths-original-pilots.git
cd dse-maths-original-pilots
node scripts/check-handoff.cjs
node server.cjs
```

3. 預覽 `http://127.0.0.1:4284/`。卷一 `/paper1/`，卷二 `/paper2/`，以 `?year=2024` 等選年份。若 4284 已被佔用，保留原程序，改用另一埠；PowerShell 可先 `$env:PORT='4285'`，macOS/Linux 可用 `PORT=4285 node server.cjs`。
4. 日常預覽不需 npm 安裝。需要瀏覽器檢查／產生 PDF 時才執行：

```sh
npm ci
npx playwright install chromium
```

Linux 若缺系統函式庫，按 Playwright 診斷安裝其需要的依賴。共用 browser-runtime 先讀本專案套件；本機既有 Codex runtime 只作後備，不是新裝置的必要條件。可設定 `BROWSER_CHANNEL=msedge` 使用已安裝 Edge。Python PDF 檢查另需 pdfplumber、Pillow 等工具；預覽和編輯不需要 Python。

2026-10-20 最新字體要求：所有英文字母、數字及數式使用 Times New Roman，中文仍使用原有字體。網頁以系統已安裝字體優先，不把商業字體檔案放進儲存庫；新電腦須確認有 Times New Roman，否則瀏覽器會使用後備字體。`qa-typography.cjs` 會檢查真正使用的字形，不只看 CSS 宣告。PDF 檢查另需 `pypdfium2`；`qa-pdfs-2023.py --all` 會渲染及核對現有七份 PDF。

## 2023 題庫及排版更新（已納入 2026-10-21 發佈）

2026-10-20 新增 2023 卷一 19 題、卷二 45 題、12 幅 SVG 幾何圖及兩份練習 PDF。卷一仍為 35+35+35=105 分；卷二第 24 題極坐標標示「已取消」，保留解答。逐題對照見 `SOURCE_ALIGNMENT_2023.md`。預設年份仍為 2026，2023 的兩卷進度及備份與舊年份隔離。

同日按使用者最新要求，所有年份的英文／數字改用 Times New Roman，Unicode 上下標改為真正的上、下標；參考解答在句界、適當的運算步驟開新行，保持原解答及配分。除法一律以分數呈現，包括複合分式、角度／百分率分式及分數指數。七份練習 PDF 一併更新字體及數學排版，沒有加入解答或縮小作答空間。公開檔案清單現為 184 檔。

本機已完成 256 題驗算、用語／全部除法顯示檢查、2023 功能／備份測試、四年份解答逐字及配分保留、五種寬度與字體檢查；首頁及進度隔離測試亦通過。七份 PDF 頁數依序為：2023 卷一 14、卷二 21；2024 卷一 15、卷二 21；2025 卷一 15、卷二 21；2026 卷一 14。重新產生後仍須檢查實際頁數及頁邊。

工作基底為 `b6571c9`；使用者已要求把本次修改提交及推送至 GitHub。本機提交身份沿用儲存庫既有作者，GitHub 存取使用官方裝置授權，不把憑證放入專案。跨裝置同步必須以推送後重新 fetch 並核對 `HEAD` 與 `origin/main` 一致為準，不能把「fetch 成功」當作「有推送權限」。Cloudflare 未更新，仍須等使用者說「上架」。

2026-10-20 工作版本的歷史內容指紋（文字換行正規化）：`6e380dbfb6c9cfaead6fee07c45ca0a84529732f0a231a3e3eb71301fa2ec29d`。當時首頁動態、互動效果、備份／篩選及四年份工作區回歸測試已通過；七份 PDF 全部渲染並目視檢查。

## 每次切換電腦

開始前先執行 `git status --short` 和 `git fetch origin`。工作目錄乾淨才執行 `git pull --ff-only`。若有未提交內容，先向使用者交代並保留；若兩端已有各自的 commit，檢查並合併，不得 force push 或 reset 丟棄內容。

完成修改後：

1. 執行與修改相符的檢查，更新這份文件的現況／待辦。
2. 用 `git diff` 和 `git status` 檢查待提交清單，只提交網站與交接所需檔案；不把原卷、密鑰或學生備份加進去。
3. 在使用者授權同步後 commit，再 `git fetch origin`。若遠端有新提交，先保留並整合，通過檢查後才 `git push origin main`。
4. 再次 fetch，確認 `git rev-parse HEAD` 與 `git rev-parse origin/main` 相同，並確認 `git status --short` 沒有遺留修改。把 commit 短碼及同步結果告訴使用者。若推送失敗，明確說未同步，不要聲稱另一部電腦已有新版。

同一時間用一部電腦修改最簡單。明天回到原來電腦也執行同一套流程；不需要重新建網站或重新 clone 已存在且正確的資料夾。若必須同時工作，使用不同分支並明確整合，不共用未合併的 `main` 工作狀態。

## 交接包的用途

附件 ZIP 是準備交接當時的原始碼快照，不是自動更新的同步資料夾。優先用 GitHub clone／pull 最新版本。ZIP 沒有 `.git`；網路無法使用時可先解壓並預覽，但恢復網路後，應另行 clone 儲存庫、比對 ZIP 內的修改，再有選擇地合併。不要直接用整個舊 ZIP 覆蓋新的 checkout，也不要對 ZIP 執行 git init 後強推。

## 本次交接驗證

2026-10-20 已從提交的 Git 版本建立一份獨立 checkout，並在新資料夾內執行 `npm ci`、`check-handoff`、發佈目錄產生、`qa-workspace.cjs` 和三輪 `qa-effects.cjs`。178 個公開檔案齊全；192 題驗算及用語、三年份兩卷五種寬度、單次題幹、列印隔離、互動、減少動態及手機檢查通過。測試用伺服器已關閉，原預覽保留。

這驗證了沒有依賴未追蹤專案檔案，但不是已經在另一部實體電腦上測試；新裝置仍須完成 Node.js／Git 安裝、GitHub 權限及必要的 Cloudflare 登入。不同作業系統重建 PDF 時仍須檢查字體。

本次網站內容指紋（文字換行正規化）：`1059321765b3a4e0338f6043014cd25cee967bc12e94f8626bcff2987c7d73ef`。此值只代表這次交接的網站內容，之後正常修改會改變，不能以舊值阻止新修改。

## 檔案位置

| 用途 | 檔案 |
| --- | --- |
| 首頁、動畫 | `index.html`、`assets/home.css`、`assets/home.js` |
| 兩卷共用介面 | `assets/workspace.css`、`assets/workspace.js`、`assets/workspace-icons.svg` |
| 介面與題目渲染 | `paper1/app.js`、`paper2/app.js`、各自的 `style.css`、`math.js` |
| 題庫 | `paper1/data-YYYY.js`、`paper2/data-YYYY.js` |
| 解答生成及排版規則 | `SOLUTION_STYLE.md` |
| 圖形與課題資料 | 各卷 `diagrams-YYYY.js`、`dse-topics.js` |
| 字體、3D 程式庫 | `assets/fonts/`、`assets/vendor/three/`，保留授權檔 |
| 練習 PDF | `output/pdf/` |
| 原卷對照與歷次設計 | `SOURCE_ALIGNMENT*.md`、`UI_DIRECTIONS_20261020.md`、`NOTATION_AUDIT_20261015.md` |
| 新裝置給 Codex 的指令 | `CODEX_PROMPT.txt` |

## 驗證

`node scripts/check-handoff.cjs` 不需額外套件：檢查公開檔案、交接文件及四年份數學／用語驗證，輸出忽略文字換行差異的網站指紋。它不會證明所有 UI 行為正確，也不代替 Git 遠端同步檢查。

啟動本機伺服器後，安裝 Playwright 即可按修改範圍執行：

```sh
node qa-workspace.cjs
node qa-effects.cjs
node qa-home.cjs
node qa-orbit.cjs
node qa-2023.cjs
node qa-typography.cjs
node qa-solutions.cjs
node qa-marking-layout.cjs
node qa-check-answers.cjs
```

`PREVIEW_URL` 可指定其他本機埠。`qa-workspace.cjs` 涵蓋四年份、兩卷及不同螢幕寬度；沒有歷史列印快照時，仍會檢查 screen CSS 不影響當前列印。舊的 palette/smoke 測試可能包含先前設計的外觀假設，應按當前 AGENTS.md 與真實問題判斷，不能為通過舊測試而恢復已取消設計。不同作業系統的中文字體後備及 PDF 字形可能不同，重新產生 PDF 後必須目視檢查換行、題號及作答空間。

PDF 產生範例：`node build-paper1-pdf.cjs 2023 1`。現有工具支援 2023/2024/2025 兩卷及 2026 卷一；2026 卷二沒有此作答空間 PDF 模式。未修改題目或列印時不要無故重新產生 PDF。

## 上架

GitHub 推送只同步原始碼，可能同時更新原有 GitHub Pages 備用站，不會自動部署 Cloudflare。正式網址繼續使用 pages.dev。

使用者說「上架」後，完成必要檢查並建立新的發佈目錄（例子中的日期／標籤每次應更新）：

```sh
node scripts/publish.cjs stage 20261021-update
```

將產生的 `tmp/publish-20261021-update/` 內容壓縮，使 ZIP 最上層直接是 `index.html`、`assets/`、`paper1/`、`paper2/` 等。登入 Cloudflare，開啟既有 `dse-maths-original-pilots` 專案，選 Production 並上傳新檔。不要建立新專案、不要上傳整個 Git 儲存庫或舊的暫存包。完成發佈後執行：

```sh
node scripts/publish.cjs verify 20261021-update
```

該檢查會下載正式網站的每個公開檔案並核對 SHA-256；本機與發佈檔案須同一份 bytes。若 Git checkout 改變換行，要用本次上傳的同一份 checkout 核對。更新 README 和本文件的發佈狀態並同步 Git。新裝置登入 Cloudflare 的工作由使用者完成，交接包不含憑證。
