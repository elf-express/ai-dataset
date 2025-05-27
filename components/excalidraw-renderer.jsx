"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import "@excalidraw/excalidraw/index.css";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  }
);

function ExcalidrawRenderer({ mermaidCode }) {
  const [excalidrawElements, setExcalidrawElements] = useState([]);
  const [excalidrawFiles, setExcalidrawFiles] = useState({});
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    if(!excalidrawAPI) return;
    
    if (!mermaidCode || mermaidCode.trim() === "") {
      setExcalidrawElements([]);
      setExcalidrawFiles({});
      setRenderError(null);
      excalidrawAPI.resetScene();
      return;
    }
    

    const renderMermaid = async () => {
      setIsRendering(true);
      setRenderError(null);

      try {
        const { elements, files } = await parseMermaidToExcalidraw(
          mermaidCode,
        );

        setExcalidrawElements(convertToExcalidrawElements(elements));
        excalidrawAPI.updateScene({
          elements: convertToExcalidrawElements(elements),
        });
        excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements(), {
          fitToContent: true,
        });
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        setRenderError("无法渲染 Mermaid 代码。请检查语法是否正确。");
        toast.error("图表渲染失败，请检查 Mermaid 代码语法");
      } finally {
        setIsRendering(false);
      }
    };

    renderMermaid();
  }, [mermaidCode]);


  return (
    <div className="space-y-2 h-full min-h-[600px]">
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
            <div className="text-destructive text-center p-4">
              {renderError}
            </div>
          </div>
        )}
        
        { (
          <Excalidraw
          initialData={{
            appState: {
              viewBackgroundColor: "#fafafa",
              currentItemFontFamily: 1,
            },
          }}
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          langCode="zh-TW"
          viewModeEnabled="disabled"
          zoomingEnabled="disabled"
          />
        )}
      </div>
    </div>
  );
}

export default ExcalidrawRenderer; 