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
