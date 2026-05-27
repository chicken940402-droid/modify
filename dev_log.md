# 🛠️ Gemini CLI 開發與除錯日誌

> **專案範疇**：1-1 長度的測量 (Svelte 5 實作)

---

## 🚨 核心禁令 (Core Mandates)

### 1. Svelte 5 命名衝突 (命名地雷)

- **錯誤現象**：頁面彈出 `500 Internal Error`。
- **禁令內容**：絕對 **不能** 在組件的 `$props()` 中使用 `state` 作為變數名稱（例如 `let { state } = $props()`）。
- **原因分析**：`state` 是 Svelte 5 的保留字，會與內建的 `$state` rune 產生不可預期的命名空間衝突。
- **標準做法**：一律重新命名為 `courseState` 或 `appState`。

### 2. 狀態檔案引用規範

- **引用方式**：針對 `.svelte.ts` 檔案，引用時建議帶上完整副檔名（例如 `import { ... } from './uiTheme.svelte.ts'`）。
- **路徑檢查**：必須嚴格核對相對路徑層級，尤其是深層目錄（如 `simulators/quiz/`）向上引用的層數。

---

## 🛠 已修復的 Bug 紀錄

### [2026-03-08] Svelte 5 命名衝突 (500 Error)

- **問題**：組件初始化失敗。
- **解決**：將 `QuestionArea`、`SimulatorDispatcher`、`LearningSidebar` 的 Props 名稱從 `state` 改為 `courseState`。

### [2026-03-08] uiTheme 載入路徑錯誤 (ERR_LOAD_URL)

- **問題**：Vite 找不到 `uiTheme.svelte.ts`。
- **解決**：校正 `QuizInput.svelte` 的引用路徑，從 `../../../../` 修正為 `../../../`。

### [2026-03-08] 模擬器與問答框轉場死結

- **問題**：純文字推導關卡（如 A4XA3）因為沒有操作觸發器，導致問答框無法彈出。
- **解決**：在 `SimulatorDispatcher` 加入邏輯，若關卡包含 `simContent` 或為 `QUIZ_UNIT` 類型，則自動標記操作正確以啟動 0.6s 的問答延遲。

### [2026-03-08] 導入 KaTeX 數學渲染引擎

- **變更說明**：為了應對未來複雜的物理公式與化學式，將推導板從純 HTML Grid 重構為 LaTeX 驅動。
- **實作細節**：
  - 安裝 `katex` 並封裝為 `Math.svelte` 組件。
  - 在 `app.css` 引入官方 CSS 並加入像素模式濾鏡。
  - 重構 `data.ts`，使用 `aligned` 環境自動對齊等號與單位。
- **優點**：極致的排版美感、極低的維護成本、完美支持次方 (`10^3`) 與希臘字母 (`\mu m`)。

---

## 🚀 未來展望與優化

- [x] **像素風格補全**：
  - 將 `RulerBase.svelte` 的直尺主體與刻度線像素化，加入黑外邊框並移除圓角。
  - 將 `RulerInteraction.svelte` 中的鉛筆動畫重構為像素塊風格（包含筆尖、筆身、橡皮擦）。
  - 將模擬器內的距離與進度顯示面板改為像素邊框樣式。
  - 優化 `QuestionArea.svelte` 中的計時器，使其在像素模式下自動切換為像素邊框。
- [x] **移除付費驗證機制**：
  - 移除 `api/quizzes` 與 `api/user-answers` 中的角色檢查，恢復所有登入使用者的存取權。
  - 移除儀表板導航欄中的 PREMIUM 標籤。
  - 移除「進入考試」按鈕與「今日任務」中的權限攔截與鎖頭圖示。
  - 簡化課程頁面的驗證流程，僅保留登入檢查。
- [ ] **A11y 標準化**：在不破壞 UI 的前提下，優化互動元素的 ARIA 標籤。
- [ ] **效能監控**：確保 $effect 的過度使用不會造成頁面重繪卡頓。
