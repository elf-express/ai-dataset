"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { countCharacters } from "@/lib/utils";

export function TextInput({ value, onChange, maxChars }) {
  const [charCount, setCharCount] = useState(0);
  
  useEffect(() => {
    setCharCount(countCharacters(value));
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const isOverLimit = maxChars && charCount > maxChars;

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="請在此輸入或貼上文字內容..."
        className="h-[200px] font-mono text-sm overflow-y-auto resize-none"
        value={value}
        onChange={handleChange}
      />
      <div className="flex justify-end text-sm">
        <span className={`${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
          {charCount} {maxChars ? `/ ${maxChars} 字數` : "字數"}
        </span>
      </div>
    </div>
  );
} 