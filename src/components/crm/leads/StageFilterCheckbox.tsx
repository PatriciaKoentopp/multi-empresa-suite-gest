
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface StageFilterCheckboxProps {
  id: string;
  label: string;
  color?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function StageFilterCheckbox({
  id,
  label,
  color,
  checked,
  onCheckedChange,
}: StageFilterCheckboxProps) {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <Checkbox 
        id={id} 
        checked={checked} 
        onCheckedChange={onCheckedChange} 
      />
      <Label 
        htmlFor={id} 
        className="cursor-pointer flex items-center"
      >
        {color && (
          <span 
            className="h-3 w-3 rounded-full inline-block mr-2" 
            style={{ backgroundColor: color }}
          />
        )}
        {label}
      </Label>
    </div>
  );
}
