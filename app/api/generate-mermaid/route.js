import { cleanText } from "@/lib/utils";

export async function POST(request) {
  try {
    const { messages, text, diagramType, aiConfig, accessPassword } = await request.json();

    // cleanedText 只在 fallback 時用
    const cleanedText = text ? cleanText(text) : "";
    
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

    // 支援多輪對話：優先用前端傳來的 messages，否則 fallback 原本 systemPrompt + cleanedText
    let usedMessages = messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      // fallback 舊邏輯
      let systemPrompt = `
                        目的和目標：
                        * 理解用户提供的文檔的結構和邏輯關係。
                        * 準確地將文檔內容和關係轉化為符合mermaid語法的圖表代碼。
                        * 確保圖表中包含文檔的所有關鍵元素和它們之間的聯繫。

                        你是一個 mermaid 流程圖專家。根據所有歷史對話，請只產生一個合併所有需求的 mermaid 流程圖區塊，且語法正確，不要產生多個流程圖，不要有多餘說明或註解。若主題極度模糊（如「隨便」或「不知道」），才用中文提醒用戶補充細節，其餘一律盡力補全並畫圖。

                        行為和規則：
                        1. 分析文檔：
                        a) 仔細閲讀和分析用户提供的文檔內容。
                        b) 識別文檔中的不同元素（如概念、實體、步驟、流程等）。
                        c) 理解這些元素之間的各種關係（如從屬、包含、流程、因果等）。
                        d) 識別文檔中藴含的邏輯結構和流程。
                        2. 圖表生成：
                        `;
      if (diagramType && diagramType !== "auto") {
        systemPrompt += `a) 請特別生成 ${diagramType} 類型的圖表。`;
      } else {
        systemPrompt += `a) 根據分析結果，選擇最適合表達文檔結構的mermaid圖表類型（流程圖、時序圖、類圖中的一種）。`;
      }
      systemPrompt += `
      b) 使用正確的mermaid語法創建圖表代碼，充分參考下面的Mermaid 語法特殊字符説明："""
* Mermaid 的核心特殊字符主要用於**定義圖表結構和關係**。
* 要在節點 ID 或標籤中**顯示**特殊字符(如括號，引號）或包含**空格**，最常用方法是用**雙引號 \`""\`** 包裹。
* 在標籤文本（引號內）中顯示 HTML 特殊字數 (\`<\`, \`>\`, \`&\`) 或 \`#\` 等，應使用 **HTML 實體編碼**。
* 使用 \`%%\` 進行**註釋**。
* 序號之後不要跟進空格，比如\`1. xxx\`應該改成\`1.xxx\`
* 用不同的背景色以區分不同層級或是從屬的元素\`
`;
      systemPrompt+=`
c) 確保圖表清晰、易於理解，準確反映文檔的內容和邏輯。

d) 不要使用<artifact>標籤包裹代碼，而是直接以markdown格式返回代碼。
`;
      systemPrompt += `
3. 細節處理：
a) 避免遺漏文檔中的任何重要細節或關係。
b) 生成的圖表代碼應可以直接複製並粘貼到支持mermaid語法的工具或平台中使用。
整體語氣：
* 保持專業和嚴謹的態度。
* 清晰、準確地表達圖表的內容。
* 在需要時，可以提供簡短的解釋或建議。
`;
      usedMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: String(cleanedText) }
      ];
    }

    // 構建API URL
    const url = finalConfig.apiUrl.includes("v1") || finalConfig.apiUrl.includes("v3") 
      ? `${finalConfig.apiUrl}/chat/completions` 
      : `${finalConfig.apiUrl}/v1/chat/completions`;
    
    console.log('Using AI config:', { 
      url, 
      modelName: finalConfig.modelName,
      hasApiKey: !!finalConfig.apiKey,
    });
    console.log('OpenAI messages:', JSON.stringify(usedMessages, null, 2));

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
              messages: usedMessages,
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
                  // 確保 data 是有效的 JSON 字符串
                  if (!data || data.trim() === '') {
                    console.warn('Received empty data chunk, skipping');
                    continue;
                  }

                  // 安全地嘗試解析 JSON
                  let parsed;
                  try {
                    parsed = JSON.parse(data);
                  } catch (parseError) {
                    console.warn('Invalid JSON received, attempting to repair:', data);
                    
                    // 嘗試修復不完整的 JSON
                    if (data.includes('"choices":[{"index":') && !data.endsWith('}]}')) {
                      // 如果 JSON 被截斷，嘗試修復它
                      const repairedData = data + '"}]}]}';
                      try {
                        parsed = JSON.parse(repairedData);
                        console.log('Successfully repaired truncated JSON');
                      } catch (repairError) {
                        console.error('Failed to repair JSON:', repairError);
                        continue; // 繼續處理下一個數據塊
                      }
                    } else {
                      // 如果無法修復，跳過這個數據塊
                      console.error('Cannot repair malformed JSON:', data);
                      continue;
                    }
                  }
                  
                  const content = parsed?.choices?.[0]?.delta?.content || '';
                  if (content) {
                    mermaidCode += content;
                    // 發送給客户端
                    controller.enqueue(encoder.encode(JSON.stringify({ 
                      chunk: content,
                      done: false 
                    })));
                  }
                } catch (e) {
                  console.error('Error processing chunk:', e, '\nData:', data);
                  // 繼續處理下一個數據塊而不中斷流程
                }
              }
            }
          }
          
          // 提取代碼塊中的內容（如果有代碼塊標記）
          const codeBlockMatch = mermaidCode.match(/```(?:mermaid)?\s*([\s\S]*?)```/);
          const finalCode = codeBlockMatch ? codeBlockMatch[1].trim() : mermaidCode;
          
          // 發送完成信號
          controller.enqueue(encoder.encode(JSON.stringify({ 
            mermaidCode: finalCode,
            done: true 
          })));
          
        } catch (error) {
          console.error("Streaming Error:", error);
          controller.enqueue(encoder.encode(JSON.stringify({ 
            error: `處理請求時發生錯誤: ${error.message}`, 
            done: true 
          })));
        } finally {
          controller.close();
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