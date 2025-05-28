import { cleanText } from "./utils";
import { getAIConfig, getSavedPassword } from "./config-service";

/**
 * Sends text to AI API for processing and returns the generated Mermaid code
 * @param {string} text - The text to process
 * @param {string} diagramType - The type of diagram to generate (e.g., 'flowchart', 'sequence', etc.)
 * @param {function} onChunk - Callback function to receive streaming chunks
 * @returns {Promise<{mermaidCode: string, error: string|null}>} - The generated Mermaid code or error
 */
export async function generateMermaidFromText(text, diagramType = "auto", onChunk = null) {
  if (!text) {
    return { mermaidCode: "", error: "請提供文本內容" };
  }
  
  // 確保輸入文本是字符串
  let textToProcess = text;
  if (typeof text !== 'string') {
    console.log('Input is not a string, converting:', typeof text);
    try {
      textToProcess = JSON.stringify(text);
    } catch (e) {
      textToProcess = String(text);
    }
  }

  // 檢查是否是有效的 Mermaid 代碼
  const isMermaidCode = (code) => {
    if (!code || typeof code !== 'string') return false;
    
    const trimmedCode = code.trim();
    
    // 如果包含中文標點符號或長文本，很可能是自然語言說明而非 Mermaid 代碼
    const hasChinesePunctuation = /[，。；：？！「」『』（）【】]/.test(trimmedCode);
    const isLongText = trimmedCode.length > 100 && !trimmedCode.includes('\n');
    
    if (hasChinesePunctuation || isLongText) {
      return false;
    }
    
    const mermaidTypes = [
      "graph", "flowchart", "sequenceDiagram", "classDiagram", 
      "stateDiagram", "erDiagram", "gantt", "pie", "journey"
    ];
    
    // 檢查是否以圖表類型開頭（必須在第一行）
    const firstLine = trimmedCode.split('\n')[0].trim();
    const isMermaidType = mermaidTypes.some(type => 
      firstLine.startsWith(type) || 
      firstLine.match(new RegExp(`^(flowchart|graph)\\s+[TBRLUD]+`))
    );
    
    if (!isMermaidType) return false;
    
    // 檢查是否包含 Mermaid 語法特徵
    const hasMermaidSyntax = 
      (trimmedCode.includes('-->') || trimmedCode.includes('->') || trimmedCode.includes('==>')) && // 包含有效的連接線
      (trimmedCode.match(/\w+\s*\[.*\]/) || // 包含節點定義
       trimmedCode.includes('subgraph') || // 包含子圖
       trimmedCode.includes('%%')) && // 包含註釋
      !trimmedCode.match(/[，。；：？！「」『』（）【】]/); // 不包含中文標點符號
    
    return hasMermaidSyntax;
  };
  
  // 清理 Mermaid 代碼的輔助函數
  const cleanMermaidCode = (code) => {
    if (!code) return '';
    
    // 1. 修復轉義的引號和方括號
    let cleaned = code.replace(/\\"/g, '"').replace(/\\\[/g, '[').replace(/\\\]/g, ']');
    
    // 2. 移除可能的代碼塊標記
    cleaned = cleaned.replace(/^```(mermaid)?\s*\n|\s*```$/g, '');
    
    // 3. 確保 direction 聲明是子圖內的第一個語句
    cleaned = cleaned.replace(/(subgraph\s+[^\n{]*\s*{)([^\n]*)(\s*direction\s+[LR|TB|RL|BT]+)/g, 
      (match, p1, p2, p3) => {
        // 如果 direction 不是子圖的第一個語句，則將其移動到最前面
        const content = p2.replace(/^\s*\n?|\s*$/g, '');
        return `${p1}\n    ${p3}${content ? '\n    ' + content : ''}`;
      }
    );
    
    // 4. 確保每個節點定義後都有換行
    cleaned = cleaned.replace(/([;}\]])(?=[^\s};\]])/g, '$1\n');
    
    // 5. 確保節點之間有適當的空格
    cleaned = cleaned.replace(/(\w\s*\[.*?\])(?=\w)/g, '$1\n');
    
    // 6. 移除多餘的空行
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  };

  // 如果輸入已經是 Mermaid 代碼，先清理再返回
  if (isMermaidCode(textToProcess)) {
    console.log('Direct Mermaid code detected, cleaning before returning');
    const cleanedCode = cleanMermaidCode(textToProcess);
    console.log('Cleaned Mermaid code:', cleanedCode);
    if (onChunk) {
      onChunk(cleanedCode);
      return { mermaidCode: cleanedCode, error: null };
    } else {
      return { mermaidCode: cleanedCode, error: null };
    }
  }

  const cleanedText = cleanText(textToProcess);
  
  if (cleanedText.length > parseInt(process.env.NEXT_PUBLIC_MAX_CHARS || "20000")) {
    return { 
      mermaidCode: "", 
      error: `文本超過${process.env.NEXT_PUBLIC_MAX_CHARS || "20000"}字符限制` 
    };
  }

  // 獲取AI配置和密碼
  const aiConfig = getAIConfig();
  const accessPassword = getSavedPassword();

  // 如果沒有提供 onChunk 回調，則使用傳統的非流式方式
  if (!onChunk) {
    return generateMermaidTraditional(cleanedText, diagramType, aiConfig, accessPassword);
  }

  try {
    const response = await fetch("/api/generate-mermaid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: cleanedText,
        diagramType,
        aiConfig, // 傳遞AI配置到後端
        accessPassword // 傳遞密碼到後端
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "生成圖表時出錯");
    }

    // 處理流式響應
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullMermaidCode = "";
    let buffer = ""; // Buffer to accumulate JSON data
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk; // Add new chunk to buffer
      
      // Process complete JSON objects from the buffer
      let startPos = 0;
      let endPos;
      
      while ((endPos = findJsonObjectEnd(buffer, startPos)) !== -1) {
        try {
          const jsonStr = buffer.substring(startPos, endPos + 1);
          const data = JSON.parse(jsonStr);
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          if (data.chunk && !data.done) {
            // 收到新的代碼片段，調用回調
            onChunk(data.chunk);
          }
          
          if (data.done && data.mermaidCode) {
            // 流式接收完成，返回最終的完整代碼
            fullMermaidCode = data.mermaidCode;
          }
          
          // Move start position for next JSON object
          startPos = endPos + 1;
          
        } catch (e) {
          console.error("Error parsing streaming chunk:", e, buffer.substring(startPos, endPos + 1));
          // Skip this malformed object
          startPos = endPos + 1;
        }
      }
      
      // Keep any remaining incomplete data in the buffer
      buffer = buffer.substring(startPos);
    }
    
    return { mermaidCode: fullMermaidCode, error: null };
  } catch (error) {
    console.error("AI API Error:", error);
    return { 
      mermaidCode: "", 
      error: error.message || "與AI服務通信時出錯" 
    };
  }
}

/**
 * 傳統的非流式 API 調用（作為備選方案）
 * @private
 */
async function generateMermaidTraditional(cleanedText, diagramType, aiConfig, accessPassword) {
  try {
    const response = await fetch("/api/generate-mermaid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: cleanedText,
        diagramType,
        aiConfig, // 傳遞AI配置到後端
        accessPassword // 傳遞密碼到後端
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "生成圖表時出錯");
    }

    const data = await response.json();
    return { mermaidCode: data.mermaidCode, error: null };
  } catch (error) {
    console.error("AI API Error:", error);
    return { 
      mermaidCode: "", 
      error: error.message || "與AI服務通信時出錯" 
    };
  }
}

/**
 * Helper function to find the end position of a JSON object in a string
 * @param {string} str - The string containing JSON data
 * @param {number} startPos - Position to start searching from
 * @returns {number} - End position of the JSON object or -1 if no complete object found
 */
function findJsonObjectEnd(str, startPos) {
  if (startPos >= str.length) return -1;
  
  // Find the start of a JSON object
  let pos = str.indexOf('{', startPos);
  if (pos === -1) return -1;
  
  let braceCount = 1;
  let inString = false;
  let escaping = false;
  
  // Parse through the string to find the matching closing brace
  for (let i = pos + 1; i < str.length; i++) {
    const char = str[i];
    
    if (escaping) {
      escaping = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escaping = true;
      continue;
    }
    
    if (char === '"' && !escaping) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        // Found the matching closing brace
        if (braceCount === 0) {
          return i;
        }
      }
    }
  }
  
  // No complete JSON object found
  return -1;
} 