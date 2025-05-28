import { cleanText } from "@/lib/utils";

export async function POST(request) {
  try {
    const { text, diagramType, aiConfig, accessPassword } = await request.json();

    if (!text) {
      return Response.json({ error: "請提供文本內容" }, { status: 400 });
    }

    const cleanedText = cleanText(text);
    
    let finalConfig;
    
    // 步驟1: 檢查是否有完整的aiConfig
    const hasCompleteAiConfig = aiConfig?.apiUrl && aiConfig?.apiKey && aiConfig?.modelName;
    
    if (hasCompleteAiConfig) {
      // 如果有完整的aiConfig，直接使用
      finalConfig = {
        apiUrl: aiConfig.apiUrl,
        apiKey: aiConfig.apiKey,
        modelName: aiConfig.modelName
      };
    } else {
      // 步驟2: 如果沒有完整的aiConfig，則檢驗accessPassword
      if (accessPassword) {
        // 步驟3: 如果傳入了accessPassword，驗證是否有效
        const correctPassword = process.env.ACCESS_PASSWORD;
        const isPasswordValid = correctPassword && accessPassword === correctPassword;
        
        if (!isPasswordValid) {
          // 如果密碼無效，直接報錯
          return Response.json({ 
            error: "訪問密碼無效" 
          }, { status: 401 });
        }
      }
      
      // 如果沒有傳入accessPassword或者accessPassword有效，使用環境變量配置
      finalConfig = {
        apiUrl: process.env.AI_API_URL,
        apiKey: process.env.AI_API_KEY,
        modelName: process.env.AI_MODEL_NAME
      };
    }

    // 檢查最終配置是否完整
    if (!finalConfig.apiUrl || !finalConfig.apiKey || !finalConfig.modelName) {
      return Response.json({ 
        error: "AI配置不完整，請在設置中配置API URL、API Key和模型名稱" 
      }, { status: 400 });
    }

    // 構建 prompt 根據圖表類型
    let systemPrompt = `
目的與任務：
* 理解使用者提供的文檔結構與邏輯。
* 將文檔內容轉化為正確且可視化的 Mermaid 圖表代碼。
* 圖表需包含文檔所有關鍵元素與其間邏輯或流程關係。

行為與規則：

1. 分析文檔：
a) 仔細閱讀並分析使用者提供的內容。
b) 識別文中不同元素（如概念、流程、實體、條件、分支等）。
c) 明確這些元素間的關係（從屬、包含、流程順序、因果等）。
d) 判斷並提取文檔的邏輯結構與層次。

2. 圖表生成：
a) ${diagramType === 'auto' ? '根據內容自動選擇最合適的 Mermaid 圖表形式' : `使用 ${diagramType} 類型的 Mermaid 圖表`}。

b) 使用正確的 Mermaid 語法生成圖表，請特別注意以下規則與範例：

  1. 節點與標籤格式：
     - 節點 ID 僅允許使用英文大小寫字母、數字、底線（_）與連字符（-），不允許使用點（.）或其他符號。
       ✔ 合法：F1_1、node-A  ✘ 非法：F1.1、node@1
     - 節點標籤請用中括號 [ ] 包裹，如：\`A[開始]\`
     - 若標籤包含空格、括號、引號等特殊字元，請使用雙引號包裹：\`A["提交申請表 (PDF)"]\`
     - 若標籤中包含 HTML 特殊字符（如 <、>、&、#），請改用 HTML 實體編碼，如 \`&lt;\`、\`&gt;\`、\`&amp;\`、\`&#35;\`

  2. Mermaid 基本語法：
     - 使用箭頭表示流程關係：\`A --> B\`
     - 使用 \`%%\` 可註解內容，不顯示在圖表中
     - 序號項目（如 1.定義）後請勿空格，避免誤解析為 markdown 列表

  3. 樣式與樣式類：
     - 樣式類應該在圖表定義之後單獨應用，而不是在節點定義時直接使用 :::
     - 正確用法：\n       \`\`\`mermaid\n       graph TD\n         A[節點1]\n         B[節點2]\n         class A style1;\n         class B style2;\n       \`\`\`
     - 錯誤用法：\`A[節點1]:::style1\`（這種寫法在某些版本中可能導致錯誤）
     - 樣式類需使用 \`classDef\` 事先定義，範例如下：\n       \`\`\`mermaid\n       classDef style1 fill:#E6F3FF,stroke:#B0C4DE,color:#333;\n       classDef style2 fill:#E8FFE8,stroke:#32CD32,color:#333;\n       classDef style3 fill:#FFF5EE,stroke:#FF6347,color:#333;\n       \`\`\`
     - 可以一次為多個節點應用相同樣式：\`class A,B,C style1;\`
     - 樣式是可選的，如果不需要可以不使用
     - 不支援在節點標籤中使用 HTML 標籤（如 <font>）來設置樣式

  4. 子圖 subgraph 語法規範：
     - 基本範例如下：\n       \`\`\`mermaid\n       graph TD\n         subgraph 子圖標題\n           direction LR\n           A --> B\n         end\n         class A,B style1;  % 在子圖外部應用樣式\n       \`\`\`
     - 子圖必須以 \`subgraph 標題\` 開始，並以 \`end\` 結束
     - 子圖內必須有 \`direction LR\` 或 \`direction TB\` 作為第一行
     - 子圖內可以包含完整的節點和連接線
     - 樣式類應該在子圖外部應用
     - 確保子圖內的方向聲明（direction）是第一個語句

  5. 完整範例：\n     \`\`\`mermaid\n     graph TD\n       %% 1. 定義節點\n       A["開始"]\n       B{"條件判斷"}\n       C[步驟一]\n       D[步驟二]\n       E[結束]\n\n       %% 2. 定義連接\n       A --> B\n       B -->|是| C\n       B -->|否| D\n       C --> E\n       D --> E\n\n       %% 3. 定義樣式\n       classDef startEnd fill:#f9f,stroke:#333,stroke-width:2px;\n       classDef decision fill:#f96,stroke:#333,stroke-width:2px;\n       classDef process fill:#bbf,stroke:#333,stroke-width:2px;\n\n       %% 4. 應用樣式\n       class A,E startEnd;\n       class B decision;\n       class C,D process;\n     \`\`\`

c) 圖表應結構清晰、易於理解，能準確反映文檔的內容與邏輯流程。

d) 不可使用 <artifact> 標籤或 HTML tag 包裹圖表，請直接以 markdown 的三個反引號 (\`\`\`) 標示代碼區塊。

3. 細節處理：
a) 請勿遺漏任何重要的元素與關聯。
b) 請確保圖表代碼可直接複製貼上至支援 Mermaid 的平台中運行與渲染。

整體語氣與風格：
* 保持專業與嚴謹，輸出結構標準且工整的 Mermaid 語法。
* 僅在需要時提供簡要說明，不贅述。
* 不應生成解釋性文字，只需輸出符合格式的 Mermaid 代碼區塊。
`;

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: cleanedText,
      },
    ];

    // 構建API URL
    const url = finalConfig.apiUrl.includes("v1") || finalConfig.apiUrl.includes("v3") 
      ? `${finalConfig.apiUrl}/chat/completions` 
      : `${finalConfig.apiUrl}/v1/chat/completions`;
    
    console.log('Using AI config:', { 
      url, 
      modelName: finalConfig.modelName,
      hasApiKey: !!finalConfig.apiKey,
    });

    // 創建一個流式響應
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 發送請求到 AI API (開啓流式模式)
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${finalConfig.apiKey}`,
            },
            body: JSON.stringify({
              model: finalConfig.modelName,
              messages,
              stream: true, // 開啓流式輸出
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("AI API Error:", response.status, errorText);
            controller.enqueue(encoder.encode(JSON.stringify({ 
              error: `AI服務返回錯誤 (${response.status}): ${errorText || 'Unknown error'}` 
            })));
            controller.close();
            return;
          }

          // 讀取流式響應
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let mermaidCode = "";
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // 解析返回的數據塊
            const chunk = decoder.decode(value, { stream: true });
            
            // 處理數據行
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content || '';
                  if (content) {
                    mermaidCode += content;
                    // 發送給客户端
                    try {
                      if (controller) {
                        controller.enqueue(encoder.encode(JSON.stringify({ 
                          chunk: content,
                          done: false 
                        })));
                      }
                    } catch (e) {
                      console.error('Error enqueuing chunk:', e);
                    }
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            }
          }
          
          // 提取代碼塊中的內容（如果有代碼塊標記）
          const codeBlockMatch = mermaidCode.match(/```(?:mermaid)?\s*([\s\S]*?)```/);
          const finalCode = codeBlockMatch ? codeBlockMatch[1].trim() : mermaidCode;
          
          // 發送完成信號
          try {
            if (controller) {
              controller.enqueue(encoder.encode(JSON.stringify({ 
                mermaidCode: finalCode,
                done: true 
              })));
              controller.close();
            }
          } catch (e) {
            console.error('Error sending final chunk:', e);
          }
          
        } catch (error) {
          console.error("Streaming Error:", error);
          try {
            if (controller) {
              controller.enqueue(encoder.encode(JSON.stringify({ 
                error: `處理請求時發生錯誤: ${error.message}`, 
                done: true 
              })));
            }
          } catch (e) {
            console.error('Error sending error response:', e);
          } finally {
            try {
              if (controller) controller.close();
            } catch (e) {
              console.error('Error closing controller:', e);
            }
          }
        }
    });

    // 返回流式響應
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return Response.json(
      { error: `處理請求時發生錯誤: ${error.message}` }, 
      { status: 500 }
    );
  }
} 