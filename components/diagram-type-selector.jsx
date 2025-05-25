"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DIAGRAM_TYPES = [
  { value: "auto", label: "自動選擇" },
  { value: "flowchart", label: "流程圖" },
  { value: "sequenceDiagram", label: "時序圖" },
  { value: "classDiagram", label: "類圖" },
];

export function DiagramTypeSelector({ value, onChange }) {
  return (
    <div className="flex items-center justify-end">
      {/* <Label htmlFor="diagram-type">圖表類型</Label> */}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="diagram-type">
          <SelectValue placeholder="選擇圖表類型" />
        </SelectTrigger>
        <SelectContent>
          {DIAGRAM_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 