# Easy DataSet 項目架構設計

## 項目概述

Easy DataSet 是一個用於創建大模型微調數據集的應用程式。用戶可以上傳文本文件，系統會自動分割文本並生成問題，最終生成用於微調的數據集。

## 技術棧

- **前端框架**: Next.js 14 (App Router)
- **UI 框架**: Material-UI (MUI)
- **數據儲存**: fs 文件系統模擬資料庫
- **開發語言**: JavaScript

## 目錄結構

```
ai-dataset/
├── app/                      # Next.js 應用目錄
│   ├── api/                 # API 路由
│   │   └── projects/       # 項目相關 API
│   ├── projects/           # 項目相關頁面
│   │   ├── [projectId]/    # 項目詳情頁面
│   └── page.js            # 首頁
├── components/             # React 組件
│   ├── home/              # 首頁相關組件
│   │   ├── HeroSection.js
│   │   ├── ProjectList.js
│   │   └── StatsCard.js
│   ├── Navbar.js          # 導航欄組件
│   └── CreateProjectDialog.js
├── lib/                    # 工具庫
│   └── db/                # 資料庫模組
│       ├── base.js        # 基礎工具函數
│       ├── projects.js    # 項目管理
│       ├── texts.js       # 文本處理
│       ├── datasets.js    # 數據集管理
│       └── index.js       # 模組導出
├── styles/                # 樣式文件
│   └── home.js           # 首頁樣式
└── local-db/             # 本地資料庫目錄
```

## 核心模組設計

### 1. 資料庫模組 (`lib/db/`)

#### base.js

- 提供基礎的文件操作功能
- 確保資料庫目錄存在
- 讀寫 JSON 文件的工具函數

#### projects.js

- 項目的 CRUD 操作
- 項目配置管理
- 項目目錄結構維護

#### texts.js

- 文獻處理功能
- 文本片段儲存和檢索
- 文件上傳處理

#### datasets.js

- 數據集生成和管理
- 問題列表管理
- 標籤樹管理

### 2. 前端組件 (`components/`)

#### Navbar.js

- 頂部導航欄
- 項目切換
- 模型選擇
- 主題切換

#### home/ 目錄組件

- HeroSection.js: 首頁頂部展示區
- ProjectList.js: 項目列表展示
- StatsCard.js: 數據統計展示
- CreateProjectDialog.js: 創建項目的對話框

### 3. 頁面路由 (`app/`)

#### 首頁 (`page.js`)

- 項目列表展示
- 創建項目入口
- 數據統計展示

#### 項目詳情頁 (`projects/[projectId]/`)

- text-split/: 文獻處理頁面
- questions/: 問題列表頁面
- datasets/: 數據集頁面
- settings/: 項目設置頁面

#### API 路由 (`api/`)

- projects/: 項目管理 API
- texts/: 文本處理 API
- questions/: 問題生成 API
- datasets/: 數據集管理 API

## 數據流設計

### 項目創建流程

1. 用戶通過首頁或導航欄創建新項目
2. 填寫項目基本資訊（名稱、描述）
3. 系統創建項目目錄和初始設定檔
4. 重定向到項目詳情頁

### 文獻處理流程

1. 用戶上傳 Markdown 文件
2. 系統保存原始文件到項目目錄
3. 調用文本分割服務，生成片段和目錄結構
4. 展示分割結果和提取的目錄

### 問題生成流程

1. 用戶選擇需要生成問題的文本片段
2. 系統調用大模型API生成問題
3. 保存問題到問題列表和標籤樹

### 數據集生成流程

1. 用戶選擇需要生成答案的問題
2. 系統調用大模型API生成答案
3. 保存數據集結果
4. 提供導出功能

## 模型配置

支持多種大模型提供商配置：

- Ollama
- OpenAI
- 矽基流動
- 深度求索
- 智譜AI

每個提供商支持配置：

- API 地址
- API 金鑰
- 模型名稱

## 未來擴展方向

1. 支持更多檔案格式（PDF、DOC等）
2. 增加數據集質量評估功能
3. 添加數據集版本管理
4. 實現團隊協作功能
5. 增加更多數據集導出格式

## 國際化處理

### 技術選型

- **國際化庫**: i18next + react-i18next
- **語言檢測**: i18next-browser-languagedetector
- **支持語言**: 英文(en)、簡體中文(zh-CN)

### 目錄結構

```
ai-dataset/
├── locales/              # 國際化資源目錄
│   ├── en/              # 英文翻譯
│   │   └── translation.json
│   ├── zh-CN/           # 簡體中文翻譯
│   │   └── translation.json
│   └── zh-TW/           # 繁體中文翻譯
│       └── translation.json
├── lib/
│   └── i18n.js          # i18next 配置
```
