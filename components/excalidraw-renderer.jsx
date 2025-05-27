"use client";

/**
 * @file excalidraw-renderer.jsx
 * @description Excalidraw渲染器組件，負責將Mermaid代碼轉換並渲染為Excalidraw圖表
 * 
 * 主要功能：
 * 1. 自動識別和轉換不同類型的Mermaid圖表(流程圖、時序圖、類圖、ER圖等)
 * 2. 將不支持的圖表類型自動轉換為流程圖或時序圖格式以確保兼容性
 * 3. 提供交互式的Excalidraw畫布，支持導出和分享
 * 4. 適配不同屏幕尺寸的響應式設計
 * 
 * 本組件實現了用戶的偏好：自動選擇圖表類型，優先使用流程圖和時序圖，
 * 因為這些類型在Excalidraw中的渲染效果最佳
 */

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import "@excalidraw/excalidraw/index.css";
import styles from "./excalidraw-renderer.module.css";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { detectIfIsERDiagram, formatEntityName, makeSafeNodeId, convertToSupportedType } from "@/lib/utils";

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  }
);

// 預設的空白流程圖模板
const DEFAULT_MERMAID_CODE = `
flowchart TD
    A[開始] --> B{決策}
    B -->|是| C[處理]
    B -->|否| D[結束]
    C --> D
`;

function ExcalidrawRenderer({ mermaidCode, showToolbar = false, viewModeEnabled = true, zenModeEnabled = true }) {
  const [excalidrawElements, setExcalidrawElements] = useState([]);
  const [excalidrawFiles, setExcalidrawFiles] = useState({});
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // 初始化畫布
  const initializeCanvas = async () => {
    if (!excalidrawAPI) return;
    
    // 如果沒有提供 mermaidCode 且畫布尚未初始化，使用預設模板
    if ((!mermaidCode || mermaidCode.trim() === "") && !initialized) {
      try {
        // 只在首次載入時顯示預設模板
        const { elements, files } = await parseMermaidToExcalidraw(DEFAULT_MERMAID_CODE);
        setExcalidrawElements(convertToExcalidrawElements(elements));
        excalidrawAPI.updateScene({
          elements: convertToExcalidrawElements(elements),
        });
        excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements(), {
          fitToContent: true,
        });
        setInitialized(true);
      } catch (error) {
        console.error("Failed to initialize canvas with default template:", error);
      }
      return;
    }
  };

  // 注意：convertERToFlow 和 convertStateToFlow 函數已移至 utils.js

  useEffect(() => {
    if (!excalidrawAPI) return;
    
    // 先初始化畫布
    if (!initialized) {
      initializeCanvas();
      return;
    }
    
    // 如果沒有 mermaidCode，維持現有畫布狀態
    if (!mermaidCode || mermaidCode.trim() === "") {
      return;
    }

    // 檢查是否為 mermaid 代碼
    let code = mermaidCode.trim();
    
    // 如果以 mermaid 開頭，移除它
    if (code.startsWith("mermaid")) {
      code = code.replace(/^mermaid\s*\n?/, "").trim();
      console.log("Removed mermaid prefix from diagram code");
    }

    // 簡單檢查是否為支持的圖表類型
    const isMermaid =
      code.startsWith("graph") ||
      code.startsWith("flowchart") ||
      code.startsWith("sequenceDiagram") ||
      code.startsWith("classDiagram") ||
      code.startsWith("stateDiagram") ||
      code.startsWith("erDiagram") ||
      code.startsWith("gantt") ||
      code.startsWith("pie");

    if (!isMermaid) {
      setRenderError(code); // 直接顯示 AI 提示
      return;
    }
    
    // 將狀態圖轉換為流程圖
    if (code.startsWith("stateDiagram") || code.startsWith("stateDiagram-v2")) {
      const originalCode = code;
      
      // 分析狀態圖代碼
      const lines = code.split('\n');
      
      // 移除開頭的stateDiagram標識
      const processedLines = lines.filter(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('stateDiagram') && !trimmed.startsWith('stateDiagram-v2') && trimmed !== '';
      });
      
      // 加入簡單的流程圖頭
      let flowchart = "flowchart LR\n";
      
      // 收集所有的狀態和轉換
      const states = new Set();
      
      // 第一遍：收集所有狀態
      for (const line of processedLines) {
        const parts = line.split('-->');
        if (parts.length >= 2) {
          states.add(parts[0].trim());
          // 取得目標狀態(可能包含標籤和其他文本)
          const targetWithLabel = parts[1].trim();
          const targetState = targetWithLabel.split(':')[0].trim();
          states.add(targetState);
        }
      }
      
      // 第二遍：為每個狀態創建節點
      for (const state of states) {
        if (state === '[*]') {
          flowchart += `    start_end(("\u958b\u59cb/\u7d50\u675f"))\n`;
        } else {
          const safeId = state.replace(/[\s*\[\]]/g, '_');
          flowchart += `    ${safeId}["${state}"]\n`;
        }
      }
      
      // 第三遍：添加轉換
      for (const line of processedLines) {
        const parts = line.split('-->');
        if (parts.length >= 2) {
          const fromState = parts[0].trim();
          const targetWithLabel = parts[1].trim();
          
          // 分離目標狀態和標籤
          const labelParts = targetWithLabel.split(':');
          const toState = labelParts[0].trim();
          const label = labelParts.length > 1 ? labelParts[1].trim() : "";
          
          // 安全的 ID
          const fromId = fromState === '[*]' ? 'start_end' : fromState.replace(/[\s*\[\]]/g, '_');
          const toId = toState === '[*]' ? 'start_end' : toState.replace(/[\s*\[\]]/g, '_');
          
          // 添加轉換行
          if (label) {
            flowchart += `    ${fromId} --"${label}"--> ${toId}\n`;
          } else {
            flowchart += `    ${fromId} --> ${toId}\n`;
          }
        }
      }
      
      code = flowchart;
      console.log("Converted state diagram to flowchart");
      toast.info("已自動將狀態圖轉換為流程圖以協助渲染");
    }
    
    // 將 ER 圖轉換為流程圖
    else if (code.startsWith("erDiagram")) {
      const originalCode = code;
      let flowchart = "flowchart LR\n";
      
      // 簡單處理：將每個非空行轉換為節點
      const entities = [];
      
      code.split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('erDiagram'))
        .forEach((line, index) => {
          const entityId = `entity${index}`;
          entities.push(entityId);
          flowchart += `    ${entityId}["${line.trim()}"]\n`;
        });
      
      // 添加簡單連接
      if (entities.length > 1) {
        for (let i = 0; i < entities.length - 1; i++) {
          flowchart += `    ${entities[i]} --> ${entities[i+1]}\n`;
        }
      }
      
      code = flowchart;
      console.log("Converted ER diagram to simplified flowchart");
      toast.info("已自動將 ER 圖轉換為流程圖以協助渲染");
    }
    
    console.log("Final code to render:", code);
    
    // 注意：已在每種圖表類型的轉換中顯示相應提示，此處不需要再檢查

    const renderMermaid = async () => {
      setIsRendering(true);
      setRenderError(null);

      try {
        console.log("Attempting to parse mermaid code:", code);
        const { elements, files } = await parseMermaidToExcalidraw(code);
        console.log("Parsed elements:", elements ? elements.length : 0);

        if (elements && elements.length > 0) {
          setExcalidrawElements(convertToExcalidrawElements(elements));
          excalidrawAPI.updateScene({
            elements: convertToExcalidrawElements(elements),
          });
          excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements(), {
            fitToContent: true,
          });
        } else {
          console.error("No elements returned from parseMermaidToExcalidraw");
          setRenderError("渲染失敗：圖表沒有產生任何元素");
        }
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        
        // 提供更詳細的錯誤信息，特別是關於支持的圖表類型
        const errorMessage = error.toString();
        let userFriendlyMessage = "圖表渲染失敗。";
        let isUnsupportedType = false;
        
        // 檢查是否為語法錯誤
        if (errorMessage.includes("Parse error") || errorMessage.includes("Syntax error")) {
          userFriendlyMessage = "Mermaid語法錯誤。請確保圖表語法正確。";
        } else if (code.includes("gantt") || code.includes("pie")) {
          isUnsupportedType = true;
          userFriendlyMessage = "已生成圖表代碼，但目前僅支持渲染流程圖(flowchart)、時序圖(sequenceDiagram)、ER 圖(erDiagram)、狀態圖(stateDiagram)和類圖(classDiagram)。";
        }
        
        setRenderError(userFriendlyMessage);
        
        // 如果是不支持的圖表類型，使用信息提示而非錯誤提示
        if (isUnsupportedType) {
          toast.info(userFriendlyMessage);
        } else {
          toast.error("圖表渲染失敗：" + userFriendlyMessage);
        }
      } finally {
        setIsRendering(false);
      }
    };

    renderMermaid();
  }, [excalidrawAPI, mermaidCode, initialized]);


  return (
    <div className={styles["excalidraw-wrapper"] + " relative h-full w-full"}>
      <div 
        className="border rounded-md h-full relative bg-card"
        style={{ touchAction: "none" }}
      >
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {renderError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-md p-6 shadow-md flex flex-col items-center max-w-lg mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              <div className="font-bold mb-2">AI 提示</div>
              <div className="text-center whitespace-pre-line">{renderError}</div>
            </div>
          </div>
        )}
        
        <Excalidraw
          initialData={{
            appState: {
              viewBackgroundColor: "#fafafa",
              currentItemFontFamily: 1,
              zenModeEnabled: zenModeEnabled,
              viewModeEnabled: viewModeEnabled,
              showStats: false,
              showHelpDialog: false,
              pendingImageElementId: null,
              gridSize: null,
              hideInterface: true,
            },
            scrollToContent: true,
          }}
          height="100%"
          width="100%"
          theme="light"
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          langCode="zh-TW"
          UIOptions={{
            canvasActions: {
              export: false,
              saveAsScene: false,
              saveToActiveFile: false,
              loadScene: false,
              clearCanvas: false,
            },
            tools: false,
            menu: false,
            personalSpace: false,
            dockedSidebarBreakpoint: null,
            elements: false,
            welcomeScreen: false,
            defaultSidebarDockedPreference: false,
          }}
          autoFocus={false}
        />
      </div>
    </div>
  );
}

export default ExcalidrawRenderer; 
