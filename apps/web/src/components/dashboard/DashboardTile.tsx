"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { DashboardTileId } from "@/hooks/useDashboardTileOrder";

/**
 * A draggable dashboard tile. Dragging is handle-scoped (the grip in the top
 * right) so the card's own buttons and links stay click-safe — the @dnd-kit
 * PointerSensor + KeyboardSensor are attached only to the grip.
 */
export function DashboardTile({
  id,
  className,
  children
}: {
  id: DashboardTileId;
  className?: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
      className={cn("group/tile relative h-full", isDragging && "z-50", className)}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder card"
        title="Drag to reorder"
        className="absolute right-2 top-2 z-30 flex h-7 w-7 cursor-grab items-center justify-center rounded-lg text-muted-foreground/40 opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:cursor-grabbing group-hover/tile:opacity-100"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {isDragging && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-[1.5rem] ring-2 ring-primary/50 shadow-2xl"
        />
      )}
      {children}
    </div>
  );
}
