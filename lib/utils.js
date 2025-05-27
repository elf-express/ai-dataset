/**
 * @file utils.js
 * @description 通用工具函數庫，包含以下幾類功能：
 * 1. UI 相關工具函數 (如 cn 用於合併 Tailwind 類)
 * 2. 文本處理函數 (如 cleanText, countCharacters, truncateText 等)
 * 3. 檔案處理函數 (如 formatFileSize, copyToClipboard 等)
 * 4. 圖表轉換工具函數 (如 detectIfIsERDiagram, formatEntityName, makeSafeNodeId 等)
 *    這些函數用於將不支持的圖表類型(如狀態圖、類圖、ER圖等)轉換為Excalidraw可渲染的流程圖格式
 * 
 * 本庫被多個組件引用，請謹慎修改
 */

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Cleans text input for better AI processing
 * @param {string} text - The input text to clean
 * @returns {string} - Cleaned text
 */
export function cleanText(text) {
  if (!text) return "";
  if (typeof text !== "string") text = String(text);
  // Remove excessive whitespace
  let cleanedText = text.replace(/\s+/g, " ");
  // Trim leading/trailing whitespace
  cleanedText = cleanedText.trim();
  return cleanedText;
}

/**
 * Counts characters in a string
 * @param {string} text - Text to count
 * @returns {number} - Character count
 */
export function countCharacters(text) {
  return text ? text.length : 0;
}

/**
 * Validates if text is within the character limit
 * @param {string} text - Text to validate
 * @param {number} limit - Maximum character limit
 * @returns {boolean} - Whether text is within limit
 */
export function isWithinCharLimit(text, limit) {
  return countCharacters(text) <= limit;
}

/**
 * Formats byte size to human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Truncates text to a specific length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, length = 100) {
  if (!text) return "";
  if (text.length <= length) return text;
  
  return text.substring(0, length) + "...";
}

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy text:", error);
    return false;
  }
}

/**
 * 判斷是否為實體關係圖
 * @param {string} diagram - 圖表代碼
 * @returns {boolean} - 是否為ER圖
 */
export function detectIfIsERDiagram(diagram) {
  // 檢查是否大多數實體名稱為全大寫
  const lines = diagram.split('\n');
  let entityCount = 0;
  let allCapsEntityCount = 0;
  
  for (const line of lines) {
    if (line.includes("class ") && !line.includes("{")) {
      entityCount++;
      const entityName = line.split("class ")[1].trim();
      if (entityName === entityName.toUpperCase() && entityName.length > 1) {
        allCapsEntityCount++;
      }
    }
  }
  
  // 如果超過50%的實體是大寫，視為ER圖
  return entityCount > 0 && (allCapsEntityCount / entityCount) > 0.5;
}

/**
 * 格式化實體名稱為更友善的形式
 * @param {string} entityName - 實體名稱
 * @returns {string} - 格式化後的名稱
 */
export function formatEntityName(entityName) {
  // 如果是全大寫，轉換為首字母大寫
  if (entityName === entityName.toUpperCase() && entityName.length > 1) {
    return entityName.charAt(0) + entityName.slice(1).toLowerCase();
  }
  return entityName;
}

/**
 * 將節點ID轉換為安全的格式
 * @param {string} id - 原始節點ID
 * @returns {string} - 安全的節點ID
 */
export function makeSafeNodeId(id) {
  // 處理特殊的開始和結束節點標記
  if (id === '[*]') {
    return 'start_state';
  }
  
  // 移除不安全字符並替換為下劃線
  return id.replace(/[\[\]\s*]/g, '_')
           .replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_')
           .replace(/^[0-9]/, 'n$&'); // 如果ID以數字開頭，加上前綴
}

/**
 * 統一轉換各種圖表類型為支持的格式
 * @param {string} diagramCode - 圖表代碼
 * @returns {string} - 轉換後的流程圖代碼
 */
export function convertToSupportedType(diagramCode) {
  console.log("convertToSupportedType called with:", diagramCode.substring(0, 100) + "...");
  
  // 檢測圖表類型
  const code = diagramCode.trim();
  
  // 如果是 ER 圖
  if (code.startsWith("erDiagram")) {
    console.log("Detected ER diagram, converting to flowchart");
    const result = convertERToFlow(code);
    console.log("ER diagram conversion result:", result.substring(0, 100) + "...");
    return result;
  }
  
  // 如果是狀態圖
  if (code.startsWith("stateDiagram") || code.startsWith("stateDiagram-v2")) {
    console.log("Detected state diagram, converting to flowchart");
    const result = convertStateToFlow(code);
    console.log("State diagram conversion result:", result.substring(0, 100) + "...");
    return result;
  }
  
  // 如果是類圖
  if (code.startsWith("classDiagram")) {
    console.log("Detected class diagram, converting to flowchart");
    const result = convertClassToFlow(code);
    console.log("Class diagram conversion result:", result.substring(0, 100) + "...");
    return result;
  }
  
  // 檢測是否是長流程圖，如果是則轉換為分組形式
  if ((code.startsWith("flowchart TD") || code.startsWith("flowchart LR") || 
       code.startsWith("graph TD") || code.startsWith("graph LR")) && 
      isLongFlowchart(code)) {
    console.log("Detected long flowchart, converting to grouped format");
    const result = convertLongFlowchartToGrouped(code);
    console.log("Long flowchart conversion result:", result.substring(0, 100) + "...");
    return result;
  }
  
  // 如果代碼中包含 mermaid 字標，則去除它
  if (code.startsWith("mermaid")) {
    console.log("Removing 'mermaid' prefix from code");
    const cleanedCode = code.replace(/^mermaid\s*\n?/, "").trim();
    return convertToSupportedType(cleanedCode); // 遞迴處理清理後的代碼
  }
  
  // 其他圖表類型直接返回
  console.log("No conversion needed, returning original code");
  return code;
}

/**
 * 將類圖轉換為流程圖
 * @param {string} classDiagram - 類圖代碼
 * @returns {string} - 流程圖代碼
 */
export function convertClassToFlow(classDiagram) {
  // 將類圖轉換為流程圖 - 目前簡單處理為只顯示類名
  const code = "flowchart TD\n" + classDiagram.split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('classDiagram'))
    .map(line => {
      // 偵測類定義行
      const classMatch = line.trim().match(/^class\s+([\w_]+)/); 
      if (classMatch) {
        const className = classMatch[1];
        return `    ${className}["${className}"]`;
      }
      return null;
    })
    .filter(Boolean)
    .join('\n');
  
  return code;
}

/**
 * 將 ER 圖轉換為流程圖格式
 * @param {string} erDiagram - ER 圖代碼
 * @returns {string} - 流程圖代碼
 */
export function convertERToFlow(erDiagram) {
  // 使用更精確的方法提取實體和關係
  
  // 1. 先分開每一行處理
  const lines = erDiagram.split('\n');
  
  // 存儲實體和關係
  const entities = {}; // 使用對象代替數組，更容易查找
  const relationships = [];
  
  // 處理目前正在分析的實體
  let currentEntity = null;
  let currentAttributes = [];
  let isInsideEntity = false;
  
  // 首先提取所有關係定義行
  const relationLines = [];
  
  // 第一遍：分離關係定義行與實體定義
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 忽略空行和 erDiagram 標識行
    if (line === '' || line === 'erDiagram') continue;

    // 直接檢查關係定義行 - 與後續操作獨立
    if (!isInsideEntity && (/\s*[\w_]+\s+[\|<>o\{\}\-]+\s+[\w_]+\s*/.test(line))) {
      console.log("Found relationship line:", line);
      relationLines.push(line);
    }
    
    // 如果該行包含屬性定義 "{"，則識別為實體開始
    if (line.includes('{')) {
      isInsideEntity = true;
      // 提取實體名稱
      currentEntity = line.split('{')[0].trim();
      currentAttributes = [];
      continue;
    }
    
    // 如果在實體定義內
    if (isInsideEntity) {
      // 端部標記
      if (line.includes('}')) {
        isInsideEntity = false;
        
        // 保存實體及其屬性
        if (currentEntity && !entities[currentEntity]) {
          const nodeId = makeSafeNodeId(currentEntity);
          entities[currentEntity] = {
            id: nodeId,
            name: formatEntityName(currentEntity),
            attributes: currentAttributes.join('\n')
          };
        }
      } else {
        // 收集屬性
        currentAttributes.push(line);
      }
    }
  }
  
  console.log("Found entities:", Object.keys(entities));
  console.log("Found relation lines:", relationLines);
  
  // 第二遍：解析關係
  for (const relationLine of relationLines) {
    console.log("Processing relation line:", relationLine);
    
    // 偵測不同的關係模式
    let entity1, entity2, label;
    
    // 使用多種模式匹配器來取得更高的成功率
    
    // 模式1: ENTITY1 ||--o{ ENTITY2 : label
    const pattern1 = /\s*([\w_]+)\s+([\|<>o\{\}\-]+)\s+([\w_]+)\s*(?::\s*([^\n]*))?/;
    let match = relationLine.match(pattern1);
    
    if (match) {
      entity1 = match[1].trim();
      entity2 = match[3].trim();
      label = match[4] ? match[4].trim() : "";
      console.log(`Pattern 1 matched: ${entity1} -> ${entity2} [${label}]`);
    } else {
      // 模式2: 簡單地尋找两個實體名稱
      const words = relationLine.split(/\s+/).filter(w => w.length > 0 && 
                                               !w.match(/[\|<>o\{\}\-:]/));
      if (words.length >= 2) {
        entity1 = words[0];
        entity2 = words[words.length-1];
        
        // 嘗試擷取標籤
        const labelMatch = relationLine.match(/:\s*([^\n]*)/); 
        label = labelMatch ? labelMatch[1].trim() : "";
        console.log(`Pattern 2 matched: ${entity1} -> ${entity2} [${label}]`);
      }
    }
    
    // 確認實體存在
    if (entity1 && entity2 && entities[entity1] && entities[entity2]) {
      console.log(`Adding relationship: ${entity1}(${entities[entity1].id}) -> ${entity2}(${entities[entity2].id})`);
      
      // 簡化處理，使用粗箭頭
      relationships.push({
        from: entities[entity1].id,
        to: entities[entity2].id,
        label: label || "",
        arrowType: "===>" // 使用粗箭頭確保可見
      });
    } else {
      console.log(`Cannot create relationship: entities not found for ${entity1} -> ${entity2}`);
    }
  }
  
  // 生成流程圖代碼 - 使用LR方向(從左到右)而非TD(從上到下)來更好地顯示關係
  let flowchartCode = "flowchart LR\n";
  
  // 收集實體IDs以確保有效連接
  const entityIds = [];
  
  // 添加實體節點 - 使用特殊的額外樣式更突出實體
  for (const entityName in entities) {
    const entity = entities[entityName];
    entityIds.push(entity.id); // 收集ID以便添加連接
    
    if (entity.attributes) {
      // 使用更清晰的框架樣式為實體建模 - 使用大一點的字體和鮭角矩形
      flowchartCode += `    ${entity.id}["${entity.name}\n===\n${entity.attributes}"]\n`;
    } else {
      flowchartCode += `    ${entity.id}["${entity.name}"]\n`;
    }
  }
  
  // 添加關係 - 使用粗箭頭線來更清晰地顯示關係
  for (const rel of relationships) {
    // 確保關係標籤非常顯著
    if (rel.label) {
      // 使用粗線和加粗的文字額外強調關係
      flowchartCode += `    ${rel.from} ==="${rel.label}"===> ${rel.to}\n`;
    } else {
      // 沒有標籤也使用粗線
      flowchartCode += `    ${rel.from} ===> ${rel.to}\n`;
    }
  }
  
  // 如果沒有找到關係，手動增加連接
  if (relationships.length === 0 && entityIds.length >= 2) {
    // 至少增加一個連接來確保圖表有意義
    flowchartCode += `    ${entityIds[0]} ===>關係==> ${entityIds[1]}\n`;
    
    // 如果有第三個實體，也增加連接
    if (entityIds.length >= 3) {
      flowchartCode += `    ${entityIds[1]} ===>包含==> ${entityIds[2]}\n`;
    }
  }
  
  console.log("Converted ER diagram to flowchart:", flowchartCode);
  return flowchartCode;
}

/**
 * 將狀態圖轉換為流程圖格式
 * @param {string} stateDiagram - 狀態圖代碼
 * @returns {string} - 流程圖代碼
 */
export function convertStateToFlow(stateDiagram) {
  // 分析狀態圖代碼
  const lines = stateDiagram.split('\n');
  
  // 存儲狀態和轉換
  const states = new Set();
  const transitions = [];
  
  // 移除開頭的stateDiagram標識
  let processedLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('stateDiagram') && !trimmed.startsWith('stateDiagram-v2') && trimmed !== '';
  });
  
  // 處理每一行
  for (const line of processedLines) {
    const trimmedLine = line.trim();
    
    // 識別狀態轉換行 - 模式: state1 --> state2: 動作標籤
    const transitionMatch = trimmedLine.match(/\s*([\w\]\[\*]+)\s+(-+>|===>)\s+([\w\]\[\*]+)(?:\s*:\s*([^\n]*))?/);
    
    if (transitionMatch) {
      const fromState = transitionMatch[1].trim();
      const toState = transitionMatch[3].trim();
      const label = transitionMatch[4] ? transitionMatch[4].trim() : "";
      
      // 將起始和結束狀態加入狀態集合
      states.add(fromState);
      states.add(toState);
      
      // 將轉換加入轉換數組
      transitions.push({ from: fromState, to: toState, label });
    }
    
    // 識別獨立的狀態定義行 - 模式: state "State Name" as stateName
    const stateDefMatch = trimmedLine.match(/\s*state\s+"([^"]*)"(?:\s+as\s+([\w]+))?/);
    
    if (stateDefMatch) {
      const stateName = stateDefMatch[2] || stateDefMatch[1];
      states.add(stateName);
    }
  }
  
  // 生成流程圖代碼 - 使用 LR 方向而非 TD，更符合 Excalidraw 渲染偏好
  let flowchartCode = "flowchart LR\n";
  
  // 添加狀態節點
  for (const state of states) {
    // 特殊處理起始和結束狀態 [*]
    if (state === '[*]') {
      // 將起始/結束狀態轉換為圓形節點
      flowchartCode += `    start_end(("\u958b\u59cb/\u7d50\u675f"))\n`;
    } else {
      // 使用簡潔的矩形表示狀態
      const stateId = makeSafeNodeId(state);
      flowchartCode += `    ${stateId}["${state}"]\n`;
    }
  }
  
  // 添加轉換
  for (const transition of transitions) {
    let fromId = transition.from === '[*]' ? 'start_end' : makeSafeNodeId(transition.from);
    let toId = transition.to === '[*]' ? 'start_end' : makeSafeNodeId(transition.to);
    
    if (transition.label) {
      // 帶標籤的轉換
      flowchartCode += `    ${fromId} ==="${transition.label}"===> ${toId}\n`;
    } else {
      // 無標籤的轉換
      flowchartCode += `    ${fromId} ===> ${toId}\n`;
    }
  }
  
  console.log("Converted state diagram to flowchart:", flowchartCode);
  return flowchartCode;
}
