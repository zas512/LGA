"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  MessageSquare,
  Paperclip,
  Scale
} from "lucide-react";
import {
  getInitials,
  isOverdue,
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  formatDueDate,
  type Task
} from "./types";

function AssigneeStack({ task }: { task: Task }) {
  const visible = task.assignees.slice(0, 3);
  const overflow = task.assignees.length - visible.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((a) => (
        <Avatar
          key={a.associateId}
          size="sm"
          title={a.associate?.fullName ?? a.associateId}
          className="ring-2 ring-card"
        >
          <AvatarFallback>
            {getInitials(a.associate?.fullName ?? "?")}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-2 ring-card">
          +{overflow}
        </span>
      )}
      {task.assignees.length === 0 && (
        <span className="text-[10px] font-semibold text-muted-foreground">
          Unassigned
        </span>
      )}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  showMatter?: boolean;
}

export function TaskCard({ task, onClick, showMatter }: Readonly<TaskCardProps>) {
  const overdue = isOverdue(task);
  const commentCount = task.notes?.length ?? 0;
  const attachmentCount = task.attachments?.length ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border border-border bg-card p-3 text-left shadow-xs transition-colors",
        "hover:border-primary/40 hover:bg-card hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "cursor-pointer",
        task.status === "COMPLETED" && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-xs font-bold leading-snug text-foreground line-clamp-2",
            task.status === "COMPLETED" && "line-through"
          )}
        >
          {task.title}
        </p>
        <Badge
          variant={PRIORITY_BADGE[task.priority]}
          className="shrink-0 text-[10px] px-2"
        >
          {PRIORITY_LABEL[task.priority]}
        </Badge>
      </div>

      {task.status === "BLOCKED" && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
          Blocked
        </span>
      )}

      {showMatter && task.matter && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          <Scale className="h-3 w-3" />
          {task.matter.firmCaseNumber}
        </span>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <AssigneeStack task={task} />
        <div className="flex items-center gap-2.5 text-[10px] font-semibold text-muted-foreground">
          {overdue ? (
            <span className="flex items-center gap-1 font-bold text-destructive">
              <CalendarDays className="h-3 w-3" />
              Overdue
            </span>
          ) : (
            task.dueDate && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {formatDueDate(task.dueDate)}
              </span>
            )
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </span>
          )}
          {attachmentCount > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {attachmentCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
