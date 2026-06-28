"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortMode = "added" | "released" | "plays";

export const SORT_LABELS: Record<SortMode, string> = {
  added: "recently added",
  released: "release date",
  plays: "most played",
};

export function SortSelect({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (value: SortMode) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortMode)}>
      <SelectTrigger size="sm" aria-label="Sort" className="font-mono lowercase">
        <SelectValue>{(v) => SORT_LABELS[v as SortMode]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
          <SelectItem key={mode} value={mode} className="font-mono lowercase">
            {SORT_LABELS[mode]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
