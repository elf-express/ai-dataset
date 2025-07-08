<div align="center">


**一個強大的大型語言模型微調數據集創建工具**

[簡體中文](./README.zh-CN.md) | [English](./README.md)

[功能特點](#功能特點) • [快速開始](#本地運行) • [使用文件](https://docs.ai-dataset.com/) • [貢獻](#貢獻) • [許可證](#許可證)

如果喜歡本項目，請給本項目留下 Star⭐️，或者請作者喝杯咖啡呀 => [打賞作者](./public/imgs/aw.jpg) ❤️！

</div>

## 概述

AI Dataset 是一個專為創建大型語言模型（LLM）微調數據集而設計的應用程式。它提供了直觀的界面，用於上傳特定領域的文件，智慧分割內容，生成問題，並為模型微調生成高品質的訓練數據。

通過 AI Dataset，您可以將領域知識轉化為結構化數據集，相容所有遵循 OpenAI 格式的 LLM API，使微調過程變得簡單高效。

![](./public/imgs/cn-arc.png)

## 功能特點

- **智慧文件處理**：支持 PDF、Markdown、DOCX 等多種格式智慧識別和處理
- **智慧文本分割**：支持多種智慧文本分割算法、支持自訂可視化分段
- **智慧問題生成**：從每個文本片段中提取相關問題
- **領域標籤**：為數據集智慧構建全局領域標籤，具備全局理解能力
- **答案生成**：使用 LLM API 為每個問題生成全面的答案、思維鏈（COT）
- **靈活編輯**：在流程的任何階段編輯問題、答案和數據集
- **多種導出格式**：以各種格式（Alpaca、ShareGPT）和文件類型（JSON、JSONL）導出數據集
- **廣泛的模型支持**：相容所有遵循 OpenAI 格式的 LLM API
- **用戶友好界面**：為技術和非技術用戶設計的直觀 UI
- **自訂系統提示**：添加自訂系統提示以引導模型響應

## 快速示範

https://github.com/user-attachments/assets/6ddb1225-3d1b-4695-90cd-aa4cb01376a8

## 本地運行

### 下載用戶端

<table style="width: 100%">
  <tr>
    <td width="20%" align="center">
      <b>Windows</b>
    </td>
    <td width="30%" align="center" colspan="2">
      <b>MacOS</b>
    </td>
    <td width="20%" align="center">
      <b>Linux</b>
    </td>
  </tr>
  <tr style="text-align: center">
    <td align="center" valign="middle">
      <a href='https://github.com/ConardLi/ai-dataset/releases/latest'>
        <img src='./public/imgs/windows.png' style="height:24px; width: 24px" />
        <br />
        <b>Setup.exe</b>
      </a>
    </td>
    <td align="center" valign="middle">
      <a href='https://github.com/ConardLi/ai-dataset/releases/latest'>
        <img src='./public/imgs/mac.png' style="height:24px; width: 24px" />
        <br />
        <b>Intel</b>
      </a>
    </td>
    <td align="center" valign="middle">
      <a href='https://github.com/ConardLi/ai-dataset/releases/latest'>
        <img src='./public/imgs/mac.png' style="height:24px; width: 24px" />
        <br />
        <b>M</b>
      </a>
    </td>
    <td align="center" valign="middle">
      <a href='https://github.com/ConardLi/ai-dataset/releases/latest'>
        <img src='./public/imgs/linux.png' style="height:24px; width: 24px" />
        <br />
        <b>AppImage</b>
      </a>
    </td>
  </tr>
</table>

### 使用 NPM 安裝

1. 複製倉庫：

```bash
   git clone https://github.com/ConardLi/ai-dataset.git
   cd ai-dataset
```

2. 安裝依賴：

```bash
   npm install
```

3. 啟動開發伺服器：

```bash
   npm run build

   npm run start
```

4. 打開瀏覽器並訪問 `http://localhost:1717`

### 使用本地 Dockerfile 構建

如果你想自行構建鏡像，可以使用項目根目錄中的 Dockerfile：

1. 複製倉庫：
   ```bash
   git clone https://github.com/ConardLi/ai-dataset.git
   cd ai-dataset
   ```
2. 構建 Docker 鏡像：
   ```bash
   docker build -t ai-dataset .
   ```
3. 運行容器：

   ```bash
   docker run -d -p 1717:1717 -v {YOUR_LOCAL_DB_PATH}:/app/local-db --name ai-dataset ai-dataset
   ```

   **注意：** 請將 `{YOUR_LOCAL_DB_PATH}` 替換為你希望儲存本地資料庫的實際路徑。

4. 打開瀏覽器，訪問 `http://localhost:1717`

## 使用方法

### 創建項目

<table>
    <tr>
        <td><img src="./public/imgs/1.png"></td>
        <td><img src="./public/imgs/2.png"></td>
    </tr>
</table>

1. 在首頁點擊"創建項目"按鈕；
2. 輸入項目名稱和描述；
3. 配置您首選的 LLM API 設置

### 處理文件

<table>
    <tr>
        <td><img src="./public/imgs/3.png"></td>
        <td><img src="./public/imgs/4.png"></td>
    </tr>
</table>

1. 在"文本分割"部分上傳您的文件（支持 PDF、Markdwon、txt、DOCX）；
2. 查看和調整自動分割的文本片段；
3. 查看和調整全局領域樹

### 生成問題

<table>
    <tr>
        <td><img src="./public/imgs/5.png"></td>
        <td><img src="./public/imgs/6.png"></td>
    </tr>
</table>

2. 基於文本塊批次構造問題；
3. 查看並編輯生成的問題；
4. 使用標籤樹組織問題

### 創建數據集

<table>
    <tr>
        <td><img src="./public/imgs/7.png"></td>
        <td><img src="./public/imgs/8.png"></td>
    </tr>
</table>

1. 基於問題批次構造數據集；
2. 使用配置的 LLM 生成答案；
3. 查看、編輯並最佳化生成的答案

### 導出數據集

<table>
    <tr>
        <td><img src="./public/imgs/9.png"></td>
        <td><img src="./public/imgs/10.png"></td>
    </tr>
</table>

1. 在數據集部分點擊"導出"按鈕；
2. 選擇您喜歡的格式（Alpaca 或 ShareGPT）；
3. 選擇檔案格式（JSON 或 JSONL）；
4. 根據需要添加自訂系統提示；
5. 導出您的數據集

## 項目結構

```
ai-dataset/
├── app/                                # Next.js 應用目錄
│   ├── api/                            # API 路由
│   │   ├── llm/                        # LLM API 集成
│   │   │   ├── ollama/                 # Ollama API 集成
│   │   │   └── openai/                 # OpenAI API 集成
│   │   ├── projects/                   # 項目管理 API
│   │   │   ├── [projectId]/            # 項目特定操作
│   │   │   │   ├── chunks/             # 文本塊操作
│   │   │   │   ├── datasets/           # 數據集生成和管理
│   │   │   │   ├── generate-questions/ # 批次問題生成
│   │   │   │   ├── questions/          # 問題管理
│   │   │   │   └── split/              # 文本分割操作
│   │   │   └── user/                   # 用戶特定項目操作
│   ├── projects/                       # 前端項目頁面
│   │   └── [projectId]/                # 項目特定頁面
│   │       ├── datasets/               # 數據集管理 UI
│   │       ├── questions/              # 問題管理 UI
│   │       ├── settings/               # 項目設置 UI
│   │       └── text-split/             # 文本處理 UI
│   └── page.js                         # 首頁
├── components/                         # React 組件
│   ├── datasets/                       # 數據集相關組件
│   ├── home/                           # 首頁組件
│   ├── projects/                       # 項目管理組件
│   ├── questions/                      # 問題管理組件
│   └── text-split/                     # 文本處理組件
├── lib/                                # 核心庫和工具
│   ├── db/                             # 資料庫操作
│   ├── i18n/                           # 國際化
│   ├── llm/                            # LLM 集成
│   │   ├── common/                     # 通用 LLM 工具
│   │   ├── core/                       # 核心 LLM 用戶端
│   │   └── prompts/                    # 提示詞模板
│   │       ├── answer.js               # 答案生成提示詞（中文）
│   │       ├── answerEn.js             # 答案生成提示詞（英文）
│   │       ├── question.js             # 問題生成提示詞（中文）
│   │       ├── questionEn.js           # 問題生成提示詞（英文）
│   │       └── ... 其他提示詞
│   └── text-splitter/                  # 文本分割工具
├── locales/                            # 國際化資源
│   ├── en/                             # 英文翻譯
│   ├── zh-CN/                          # 簡體中文翻譯
│   └── zh-TW/                          # 繁體中文翻譯
├── public/                             # 靜態資源
│   └── imgs/                           # 圖片資源
└── local-db/                           # 本地文件資料庫
    └── projects/                       # 項目數據儲存
```




## 許可證

本項目採用 AGPL 3.0 許可證 - 有關詳細資訊，請參閱 [LICENSE](LICENSE) 文件。

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ConardLi/ai-dataset&type=Date)](https://www.star-history.com/#ConardLi/ai-dataset&Date)

