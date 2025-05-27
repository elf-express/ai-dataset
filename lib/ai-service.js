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
    const mermaidTypes = [
      "graph", "flowchart", "sequenceDiagram", "classDiagram", 
      "stateDiagram", "erDiagram", "gantt", "pie", "journey"
    ];
    
    // 檢查是否以圖表類型開頭
    return mermaidTypes.some(type => 
      trimmedCode.startsWith(type) || 
      trimmedCode.match(new RegExp(`^(flowchart|graph)\\s+[TBRLUD]+`))
    );
  };
  
  // 如果輸入已經是 Mermaid 代碼，直接返回
  if (isMermaidCode(textToProcess)) {
    console.log('Direct Mermaid code detected, returning without AI processing');
    if (onChunk) {
      onChunk(textToProcess);
      return { mermaidCode: textToProcess, error: null };
    } else {
      return { mermaidCode: textToProcess, error: null };
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