"use client";

import { LayoutGrid, List } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type ViewMode = "tiles" | "list";

export function ViewSwitcher({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      value={[value]}
      onValueChange={(v) => {
        const next = Array.isArray(v) ? v[0] : v;
        if (next === "tiles" || next === "list") onChange(next);
      }}
    >
      <ToggleGroupItem value="tiles" aria-label="Tiles view">
        <LayoutGrid />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
