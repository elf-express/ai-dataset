# Smart Mermaid: AI-Powered Text-to-Mermaid Chart Tool

Smart Mermaid is a web application that leverages artificial intelligence to intelligently convert your text descriptions into Mermaid format chart code and render them as visual diagrams in real-time. Whether it's flowcharts, sequence diagrams, Gantt charts, or state diagrams, simply input your text, and the AI will generate the corresponding chart for you.

## Try it Out

[https://AI-mermaid.aizhi.site](https://AI-mermaid.aizhi.site)

**Note:** The application has a built-in API Key, allowing you to use it for free directly. To prevent resource abuse, we have set a daily limit of 5 free generations per user.

## Preview

*Image: Smart Mermaid interface and generated chart*

## Core Advantages

  * **Simplify Chart Drawing**: Say goodbye to the tedious manual writing of Mermaid code; generate charts quickly through natural language descriptions.
  * **Increase Efficiency**: Rapidly transform ideas into visual charts, saving you time on documentation and presentations.
  * **Intelligent Assistance**: AI automatically analyzes text, understands intent, and selects the appropriate chart type (or you can specify it).
  * **Flexible Configuration**: Supports custom AI service configurations to meet the needs of different users.

## Main Features

### 🎯 Core Features

  * **Flexible Text Input**:

      * Manually type or paste text directly into the editor.
      * Supports uploading files (.txt, .md, .docx format).
      * Supports a maximum input length of 20,000 characters.

  * **Intelligent AI Conversion**:

      * Integrates advanced AI models to analyze text content.
      * Supports automatic identification of the best chart type or user-specified type.
      * Accurately generates Mermaid-compliant chart code.

  * **Convenient Chart Display & Editing**:

      * Clearly displays the AI-generated Mermaid source code.
      * Integrated with Excalidraw for visual chart rendering.
      * Supports secondary editing and exporting of charts on the Excalidraw canvas (e.g., PNG, SVG).

### 🔧 Advanced Features

  * **Custom AI Configuration**:

      * Supports configuring your own AI service API (OpenAI, Azure OpenAI, other compatible services).
      * Allows customization of API URL, API Key, and model name.
      * Enjoy unlimited usage after configuring your own AI service.

  * **Access Permission Management**:

      * Built-in access password feature; verified users enjoy unlimited usage.
      * Supports multiple usage modes: Free Limited → Password Verified → Custom Configuration.

  * **Usage Statistics**:

      * Real-time display of remaining usage counts.
      * Locally stores usage records, reset daily.

## Usage Permissions Explained

Smart Mermaid offers three usage modes:

### 📊 Free Mode

  - **Limit**: 5 free generations per day
  - **Suitable for**: Light users, occasional use
  - **No Configuration Needed**: Ready to use out-of-the-box

### 🔑 Password Mode

  - **Permissions**: Unlimited usage after entering the access password
  - **Suitable for**: Authorized users
  - **How to Obtain**: Contact the author to get the access password

### ⚙️ Custom Configuration Mode

  - **Permissions**: Unlimited usage
  - **Suitable for**: Users with their own AI service
  - **Configuration**: Fill in your API configuration in the settings
  - **Advantage**: Complete autonomy, no dependencies

## How to Use

### Basic Usage Flow

1.  **Input Descriptive Text**:

      * Directly type or paste your chart description into the text area on the left.
      * Alternatively, click the upload button to select a local `.txt`, `.md`, or `.docx` file.

2.  **Select Chart Type**:

      * Choose your desired chart type from the dropdown menu (e.g., Flowchart, Sequence Diagram).
      * You can also select "Auto Select," letting the AI determine the most suitable chart type based on the text content.

3.  **Generate Chart**:

      * Click the "Generate Chart" button.
      * The AI will process your text and display the generated Mermaid code and the Excalidraw-rendered chart in the right-hand area.

4.  **View & Edit**:

      * You can directly view or modify the code in the Mermaid code area, and the chart will update in real-time.
      * The Excalidraw canvas supports dragging elements, modifying styles, and exporting the chart.

### Unlock Unlimited Usage

#### Method One: Use Access Password

1.  Click the settings button in the top right corner.
2.  Enter the password in the "Access Password" tab.
3.  Upon successful verification, you will have unlimited usage.

#### Method Two: Configure Custom AI Service

1.  Click the settings button in the top right corner.
2.  Fill in your configuration in the "AI Configuration" tab:
      - **API URL**: Your AI service address (e.g., `https://api.openai.com/v1`)
      - **API Key**: Your API key
      - **Model Name**: The model to use (e.g., `gpt-3.5-turbo`, `gpt-4`)
3.  Save the configuration to enjoy unlimited usage.

#### Obtain Access

  - **Contact Author**: Scan the QR code in the app or contact via GitHub Issues.
  - **BYO AI Service**: Use your own OpenAI API Key or other compatible services.

## Tech Stack

  * **Frontend Framework**: Next.js 15 (using App Router)
  * **UI Component Library**: shadcn/ui
  * **CSS Framework**: Tailwind CSS
  * **Chart Rendering & Processing**:
      * Excalidraw (`@excalidraw/excalidraw`)
      * Mermaid to Excalidraw conversion (`@excalidraw/mermaid-to-excalidraw`)
  * **File Parsing**: mammoth (for processing `.docx` files)
  * **AI Service**: Compatible with OpenAI API mode

## Local Deployment Guide

### Prerequisites

  * Node.js 18.x or higher
  * npm or yarn package manager

### Installation Steps

1.  **Clone the repository**:

    ```bash
    git clone [https://github.com/yourusername/AI-mermaid.git](https://github.com/yourusername/AI-mermaid.git)
    cd AI-mermaid
    ```

    *(Please replace `yourusername` with the actual repository path)*

2.  **Install project dependencies**:

    ```bash
    npm install
    # Or
    yarn install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the project root directory and fill in the following configuration:

    ```plaintext
    # AI Service Configuration (Required)
    AI_API_URL=https://api.openai.com/v1
    AI_API_KEY=your-api-key-here
    AI_MODEL_NAME=gpt-3.5-turbo

    # Application Configuration
    NEXT_PUBLIC_MAX_CHARS=20000
    NEXT_PUBLIC_DAILY_USAGE_LIMIT=5

    # Access Password (Optional)
    ACCESS_PASSWORD=set-your-access-password
    ```

    **Environment Variables Explained**:

      * `AI_API_URL`: Base URL of the AI service API (without `/chat/completions`)
      * `AI_API_KEY`: Your AI service API key
      * `AI_MODEL_NAME`: Specifies the AI model name to use
      * `NEXT_PUBLIC_MAX_CHARS`: Maximum number of characters allowed for user input (default 20,000)
      * `NEXT_PUBLIC_DAILY_USAGE_LIMIT`: Daily free usage limit per user (default 5)
      * `ACCESS_PASSWORD`: Optional, if set, users can enter this password to gain unlimited usage

4.  **Start the development server**:

    ```bash
    npm run dev
    # Or
    yarn dev
    ```

5.  **Access the application**:
    Open `http://localhost:3000` in your browser to access the locally deployed application.

## Contributions & Feedback

If you encounter any issues or have feature suggestions, please feel free to raise them via GitHub Issues. We also welcome you to fork this project and submit Pull Requests to contribute!

If this project is helpful to you, please give us a ⭐️ Star\!