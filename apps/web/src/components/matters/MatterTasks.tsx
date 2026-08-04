"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Calendar,
  Plus,
  Loader2,
  Paperclip,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Send,
  Eye
} from "lucide-react";
import type { SubmitEvent } from "react";

// Create Task Schema
const createTaskSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Task title must be at least 3 characters" }),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  taskType: z.enum([
    "DOCUMENT_FILING",
    "PRINTING_BINDING",
    "CLIENT_FOLLOWUP",
    "WITNESS_BRIEFING",
    "LEGAL_RESEARCH",
    "OTHER"
  ]),
  dueDate: z.string().min(1, { message: "Due date is required" }),
  assignedToId: z.string().min(1, { message: "Assignee is required" })
});

type CreateTaskValues = z.infer<typeof createTaskSchema>;

// Complete Task Schema
const completeTaskSchema = z.object({
  completionNotes: z
    .string()
    .min(3, { message: "Completion notes must be at least 3 characters" })
});

type CompleteTaskValues = z.infer<typeof completeTaskSchema>;

interface Associate {
  id: string;
  name?: string | null;
  email: string;
}

interface TaskNote {
  id: string;
  authorId: string;
  note: string;
  createdAt: string;
  author?: {
    fullName: string;
    email: string;
  } | null;
}

interface TaskAttachment {
  id: string;
  fileUrl: string;
  label?: string | null;
  uploadedById: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  taskType?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "UNDER_REVIEW" | "COMPLETED" | "BLOCKED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate?: string | null;
  completionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedToId: string;
  assignedById: string;
  assignedTo?: {
    fullName: string;
    email: string;
  } | null;
  assignedBy?: {
    fullName: string;
    email: string;
  } | null;
  notes: TaskNote[];
  attachments: TaskAttachment[];
}

interface MatterTasksProps {
  id: string;
  userRole: string | undefined;
}

export function MatterTasks({ id, userRole }: Readonly<MatterTasksProps>) {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  // Comments & Attachments local state
  const [newComment, setNewComment] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentLabel, setAttachmentLabel] = useState("");
  const [isSubmittingAttachment, setIsSubmittingAttachment] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isAdmin = userRole === "OWNER" || userRole === "ADMIN";

  // 1. Fetch Tasks
  const {
    data: tasks = [],
    refetch,
    isRefetching
  } = useQuery<Task[]>({
    queryKey: ["matter-tasks", id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?matterId=${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return res.json();
    }
  });

  // 2. Fetch Associates (to resolve assignees & list dropdown in create form)
  const { data: associates = [] } = useQuery<Associate[]>({
    queryKey: ["associates"],
    queryFn: async () => {
      const res = await fetch("/api/associates");
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Find caller associate ID
  const currentUserAssociate = useMemo(() => {
    // If associate list is loaded, match by role or check own email if possible.
    // Standard approach: can fetch details or just verify.
    // For now, associates list returns standard staff.
    return associates[0] || null;
  }, [associates]);

  // Form setup
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    setValue: setValueCreate,
    formState: { errors: errorsCreate, isSubmitting: isSubmittingCreate }
  } = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      taskType: "DOCUMENT_FILING",
      dueDate: "",
      assignedToId: ""
    }
  });

  const {
    register: registerComplete,
    handleSubmit: handleSubmitComplete,
    reset: resetComplete,
    formState: { errors: errorsComplete, isSubmitting: isSubmittingComplete }
  } = useForm<CompleteTaskValues>({
    resolver: zodResolver(completeTaskSchema),
    defaultValues: {
      completionNotes: ""
    }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (values: CreateTaskValues) => {
      const payload = {
        ...values,
        matterId: id,
        dueDate: new Date(values.dueDate).toISOString()
      };
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to delegate task");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Task delegated successfully.");
      resetCreate();
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["matter-tasks", id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delegate task");
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      taskId,
      status
    }: {
      taskId: string;
      status: string;
    }) => {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to update status");
      }
      return result;
    },
    onSuccess: (data) => {
      toast.success("Task status updated.");
      setSelectedTask(data);
      queryClient.invalidateQueries({ queryKey: ["matter-tasks", id] });
      queryClient.invalidateQueries({ queryKey: ["matter-timeline", id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update task status");
    }
  });

  // Complete Mutation
  const completeMutation = useMutation({
    mutationFn: async ({
      taskId,
      values
    }: {
      taskId: string;
      values: CompleteTaskValues;
    }) => {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to mark complete");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Task marked as completed.");
      resetComplete();
      setIsCompleteOpen(false);
      setIsDetailOpen(false);
      setSelectedTask(null);
      queryClient.invalidateQueries({ queryKey: ["matter-tasks", id] });
      queryClient.invalidateQueries({ queryKey: ["matter-timeline", id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to complete task");
    }
  });

  const onCreateSubmit = (values: CreateTaskValues) => {
    createMutation.mutate(values);
  };

  const onCompleteSubmit = (values: CompleteTaskValues) => {
    if (!selectedTask) return;
    completeMutation.mutate({ taskId: selectedTask.id, values });
  };

  // Add Comment
  const handleAddComment = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;
    setIsSubmittingComment(true);

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newComment })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to add comment");

      toast.success("Comment added.");
      setSelectedTask(result);
      setNewComment("");
      await queryClient.invalidateQueries({ queryKey: ["matter-tasks", id] });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to add comment";
      toast.error(errMsg);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Add Attachment
  const handleAddAttachment = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTask || !attachmentUrl.trim()) return;
    setIsSubmittingAttachment(true);

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: attachmentUrl,
          label: attachmentLabel || null
        })
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "Failed to link attachment");

      toast.success("Attachment linked successfully.");
      setSelectedTask(result);
      setAttachmentUrl("");
      setAttachmentLabel("");
      await queryClient.invalidateQueries({ queryKey: ["matter-tasks", id] });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to link attachment";
      toast.error(errMsg);
    } finally {
      setIsSubmittingAttachment(false);
    }
  };

  const getPriorityBadge = (prio: string) => {
    let variant: "default" | "secondary" | "destructive" | "navy" | "amber" =
      "secondary";
    if (prio === "LOW") variant = "secondary";
    else if (prio === "MEDIUM") variant = "navy";
    else if (prio === "HIGH") variant = "amber";
    else if (prio === "CRITICAL") variant = "destructive";

    return (
      <Badge
        variant={variant}
        className="text-[9px] font-extrabold tracking-wide"
      >
        {prio}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    let variant: "emerald" | "destructive" | "amber" | "outline" | "navy" =
      "outline";
    if (status === "COMPLETED") variant = "emerald";
    else if (status === "UNDER_REVIEW") variant = "amber";
    else if (status === "IN_PROGRESS") variant = "navy";

    return (
      <Badge variant={variant} className="text-[9px] font-bold uppercase">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const openCreateDialog = () => {
    resetCreate();
    // Pre-assign to self if associate
    if (!isAdmin && currentUserAssociate) {
      setValueCreate("assignedToId", currentUserAssociate.id);
    }
    setIsCreateOpen(true);
  };

  const openDetailDialog = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  // Group tasks
  const groupedTasks = useMemo(() => {
    const pending = tasks.filter((t) => t.status === "PENDING");
    const progress = tasks.filter((t) => t.status === "IN_PROGRESS");
    const review = tasks.filter((t) => t.status === "UNDER_REVIEW");
    const completed = tasks.filter(
      (t) => t.status === "COMPLETED" || t.status === "BLOCKED"
    );

    return { pending, progress, review, completed };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Delegated Work Checklist
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            Assign tasks to associates and track proof-of-work updates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={openCreateDialog}
            className="skeuo-button-primary rounded-xl text-sm font-bold gap-1"
          >
            <Plus className="h-4 w-4" />
            <span>Delegate Task</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-xl text-sm font-semibold border-border"
          >
            Sync Tasks
          </Button>
        </div>
      </div>

      {/* Columns Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* PENDING COLUMN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/80 pb-2 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pending
            </span>
            <Badge
              variant="outline"
              className="text-xs font-bold h-5 w-5 flex items-center justify-center p-0"
            >
              {groupedTasks.pending.length}
            </Badge>
          </div>
          <div className="space-y-3 max-h-125 overflow-y-auto pr-1">
            {groupedTasks.pending.map((t) => (
              <Card
                key={t.id}
                onClick={() => openDetailDialog(t)}
                className="skeuo-card bg-card text-card-foreground p-4 cursor-pointer hover:border-primary/50 relative overflow-hidden"
              >
                <h4 className="text-sm font-bold text-foreground truncate">
                  {t.title}
                </h4>
                <p className="text-sm text-muted-foreground font-medium line-clamp-2 mt-1">
                  {t.description || "No description provided."}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 text-xs">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary/70" />
                    {t.dueDate
                      ? new Date(t.dueDate).toLocaleDateString()
                      : "No due date"}
                  </span>
                  {getPriorityBadge(t.priority)}
                </div>
              </Card>
            ))}
            {groupedTasks.pending.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending tasks.
              </p>
            )}
          </div>
        </div>

        {/* IN_PROGRESS COLUMN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/80 pb-2 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              In Progress
            </span>
            <Badge
              variant="navy"
              className="text-xs font-bold h-5 w-5 flex items-center justify-center p-0"
            >
              {groupedTasks.progress.length}
            </Badge>
          </div>
          <div className="space-y-3 max-h-125 overflow-y-auto pr-1">
            {groupedTasks.progress.map((t) => (
              <Card
                key={t.id}
                onClick={() => openDetailDialog(t)}
                className="skeuo-card bg-card text-card-foreground p-4 cursor-pointer hover:border-primary/50 relative overflow-hidden"
              >
                <h4 className="text-sm font-bold text-foreground truncate">
                  {t.title}
                </h4>
                <p className="text-sm text-muted-foreground font-medium line-clamp-2 mt-1">
                  {t.description || "No description provided."}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 text-xs">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary/70" />
                    {t.dueDate
                      ? new Date(t.dueDate).toLocaleDateString()
                      : "No due date"}
                  </span>
                  {getPriorityBadge(t.priority)}
                </div>
              </Card>
            ))}
            {groupedTasks.progress.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks in progress.
              </p>
            )}
          </div>
        </div>

        {/* UNDER_REVIEW COLUMN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/80 pb-2 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Under Review
            </span>
            <Badge
              variant="amber"
              className="text-xs font-bold h-5 w-5 flex items-center justify-center p-0"
            >
              {groupedTasks.review.length}
            </Badge>
          </div>
          <div className="space-y-3 max-h-125 overflow-y-auto pr-1">
            {groupedTasks.review.map((t) => (
              <Card
                key={t.id}
                onClick={() => openDetailDialog(t)}
                className="skeuo-card bg-card text-card-foreground p-4 cursor-pointer hover:border-primary/50 relative overflow-hidden"
              >
                <h4 className="text-sm font-bold text-foreground truncate">
                  {t.title}
                </h4>
                <p className="text-sm text-muted-foreground font-medium line-clamp-2 mt-1">
                  {t.description || "No description provided."}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 text-xs">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary/70" />
                    {t.dueDate
                      ? new Date(t.dueDate).toLocaleDateString()
                      : "No due date"}
                  </span>
                  {getPriorityBadge(t.priority)}
                </div>
              </Card>
            ))}
            {groupedTasks.review.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks pending review.
              </p>
            )}
          </div>
        </div>

        {/* COMPLETED COLUMN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/80 pb-2 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Completed
            </span>
            <Badge
              variant="emerald"
              className="text-xs font-bold h-5 w-5 flex items-center justify-center p-0"
            >
              {groupedTasks.completed.length}
            </Badge>
          </div>
          <div className="space-y-3 max-h-125 overflow-y-auto pr-1">
            {groupedTasks.completed.map((t) => (
              <Card
                key={t.id}
                onClick={() => openDetailDialog(t)}
                className="skeuo-card bg-card text-card-foreground p-4 cursor-pointer hover:border-primary/50 relative overflow-hidden opacity-80 hover:opacity-100"
              >
                <h4 className="text-sm font-bold text-muted-foreground line-through truncate">
                  {t.title}
                </h4>
                {t.completionNotes && (
                  <p className="text-xs text-emerald-600 bg-emerald-500/5 p-1 rounded border border-emerald-500/10 mt-1 italic line-clamp-1">
                    Proof: &ldquo;{t.completionNotes}&rdquo;
                  </p>
                )}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 text-xs">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Completed
                  </span>
                  {getPriorityBadge(t.priority)}
                </div>
              </Card>
            ))}
            {groupedTasks.completed.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No completed tasks.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl bg-card border-border rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              Delegate Task / Assignment
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Define operational case work or legal research tasks.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitCreate(onCreateSubmit)}
            className="space-y-4 py-2"
          >
            {/* Title */}
            <div className="space-y-1">
              <Label
                htmlFor="title"
                className="text-xs font-bold text-foreground"
              >
                Task Title *
              </Label>
              <Input
                id="title"
                placeholder="e.g. File replica statement / Print brief"
                {...registerCreate("title")}
                className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
              />
              {errorsCreate.title && (
                <p className="text-xs text-destructive font-semibold">
                  {errorsCreate.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label
                htmlFor="description"
                className="text-xs font-bold text-foreground"
              >
                Detailed Description
              </Label>
              <textarea
                id="description"
                placeholder="Instructions for the associate..."
                rows={3}
                {...registerCreate("description")}
                className="w-full text-sm p-3 rounded-xl border border-border bg-card text-foreground font-medium outline-none focus:border-primary focus-visible:ring-primary/40 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-1">
                <Label
                  htmlFor="priority"
                  className="text-xs font-bold text-foreground"
                >
                  Priority Rating *
                </Label>
                <select
                  id="priority"
                  {...registerCreate("priority")}
                  className="w-full text-sm h-8 px-3 rounded-xl border border-border bg-card text-foreground font-semibold outline-none focus:border-primary"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Task Type */}
              <div className="space-y-1">
                <Label
                  htmlFor="taskType"
                  className="text-xs font-bold text-foreground"
                >
                  Task Type *
                </Label>
                <select
                  id="taskType"
                  {...registerCreate("taskType")}
                  className="w-full text-sm h-8 px-3 rounded-xl border border-border bg-card text-foreground font-semibold outline-none focus:border-primary"
                >
                  <option value="DOCUMENT_FILING">Document Filing</option>
                  <option value="PRINTING_BINDING">Printing & Binding</option>
                  <option value="CLIENT_FOLLOWUP">Client Follow-up</option>
                  <option value="WITNESS_BRIEFING">Witness Briefing</option>
                  <option value="LEGAL_RESEARCH">Legal Research</option>
                  <option value="OTHER">Other / Misc</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Due Date */}
              <div className="space-y-1">
                <Label
                  htmlFor="dueDate"
                  className="text-xs font-bold text-foreground"
                >
                  Due Date *
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...registerCreate("dueDate")}
                  className="text-sm rounded-xl border-border bg-card focus-visible:ring-primary/40"
                />
                {errorsCreate.dueDate && (
                  <p className="text-xs text-destructive font-semibold">
                    {errorsCreate.dueDate.message}
                  </p>
                )}
              </div>

              {/* Assigned To */}
              <div className="space-y-1">
                <Label
                  htmlFor="assignedToId"
                  className="text-xs font-bold text-foreground"
                >
                  Assignee *
                </Label>
                <select
                  id="assignedToId"
                  disabled={!isAdmin}
                  {...registerCreate("assignedToId")}
                  className="w-full text-sm h-8 px-3 rounded-xl border border-border bg-card text-foreground font-semibold outline-none focus:border-primary disabled:opacity-75"
                >
                  <option value="">Select Counsel</option>
                  {associates.map((assoc) => (
                    <option key={assoc.id} value={assoc.id}>
                      {assoc.name || assoc.email}
                    </option>
                  ))}
                </select>
                {errorsCreate.assignedToId && (
                  <p className="text-xs text-destructive font-semibold">
                    {errorsCreate.assignedToId.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl text-sm font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingCreate}
                className="skeuo-button-primary rounded-xl text-sm font-bold gap-1.5"
              >
                {isSubmittingCreate ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Delegating...</span>
                  </>
                ) : (
                  <span>Assign Task</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Detail Workspace Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-card border-border rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedTask.status)}
                  {getPriorityBadge(selectedTask.priority)}
                  <Badge
                    variant="outline"
                    className="text-xs uppercase font-bold"
                  >
                    {selectedTask.taskType || "TASK"}
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-black text-foreground mt-2">
                  {selectedTask.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <span>
                    Assigned to:{" "}
                    <strong>
                      {selectedTask.assignedTo?.fullName || "Counsel"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Delegated by:{" "}
                    <strong>
                      {selectedTask.assignedBy?.fullName || "Admin"}
                    </strong>
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-3">
                {/* Description */}
                <div>
                  <h5 className="text-xs font-bold text-muted-foreground uppercase">
                    Instructions / Details
                  </h5>
                  <p className="text-sm text-foreground mt-1 leading-relaxed bg-muted/20 border border-border/40 p-3 rounded-xl font-medium">
                    {selectedTask.description ||
                      "No specific instructions provided."}
                  </p>
                </div>

                {/* Workflow Status Actions */}
                <div className="border border-border/80 rounded-xl p-3 bg-muted/10 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground uppercase">
                      Status Transition Flow
                    </h5>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      Move task state forward
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedTask.status === "PENDING" && (
                      <Button
                        size="xs"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            taskId: selectedTask.id,
                            status: "IN_PROGRESS"
                          })
                        }
                        className="rounded-xl text-xs font-bold gap-1 px-3 py-1.5"
                      >
                        <span>Start Work</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}

                    {selectedTask.status === "IN_PROGRESS" && (
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              taskId: selectedTask.id,
                              status: "UNDER_REVIEW"
                            })
                          }
                          className="rounded-xl text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 border-amber-500/20 px-3 py-1.5"
                        >
                          Submit for Review
                        </Button>
                        <Button
                          size="xs"
                          onClick={() => setIsCompleteOpen(true)}
                          className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5"
                        >
                          Mark Complete
                        </Button>
                      </div>
                    )}

                    {selectedTask.status === "UNDER_REVIEW" && (
                      <>
                        {isAdmin ? (
                          <div className="flex gap-2">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  taskId: selectedTask.id,
                                  status: "PENDING"
                                })
                              }
                              className="rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/20 px-3 py-1.5"
                            >
                              Reopen / Reject
                            </Button>
                            <Button
                              size="xs"
                              onClick={() => setIsCompleteOpen(true)}
                              className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-3 py-1.5"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              <span>Approve & Complete</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                            Under Review — Awaiting Admin Approval
                          </span>
                        )}
                      </>
                    )}

                    {selectedTask.status === "COMPLETED" && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Completed & Approved</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Comments Thread */}
                  <div className="space-y-2 border-r border-border/40 pr-2">
                    <h5 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>Discussion Thread</span>
                    </h5>

                    <div className="space-y-3 max-h-40 overflow-y-auto border border-border/60 rounded-xl p-3 bg-muted/5">
                      {selectedTask.notes.map((note) => (
                        <div
                          key={note.id}
                          className="text-xs leading-relaxed border-b border-border/20 pb-2 last:border-b-0"
                        >
                          <div className="flex items-center justify-between font-bold text-foreground">
                            <span>
                              {note.author?.fullName || "Legal Staff"}
                            </span>
                            <span className="text-xs text-muted-foreground font-normal">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-0.5 font-medium">
                            {note.note}
                          </p>
                        </div>
                      ))}
                      {selectedTask.notes.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          No discussions logged.
                        </p>
                      )}
                    </div>

                    <form
                      onSubmit={handleAddComment}
                      className="flex gap-1.5 pt-1"
                    >
                      <Input
                        placeholder="Type notes / progress updates..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="text-sm rounded-xl h-8 border-border bg-card flex-1 focus-visible:ring-primary/40"
                      />
                      <Button
                        type="submit"
                        disabled={isSubmittingComment || !newComment.trim()}
                        className="h-8 w-8 rounded-xl p-0 shrink-0"
                      >
                        {isSubmittingComment ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </form>
                  </div>

                  {/* Proof Attachments */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      <span>Work Proof Attachments</span>
                    </h5>

                    <div className="space-y-2 max-h-40 overflow-y-auto border border-border/60 rounded-xl p-3 bg-muted/5">
                      {selectedTask.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg border border-border bg-card"
                        >
                          <span className="font-bold text-foreground truncate max-w-37.5">
                            {att.label || "File Link"}
                          </span>
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline font-bold shrink-0"
                          >
                            <span>Open</span>
                            <Eye className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                      {selectedTask.attachments.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          No proof files linked.
                        </p>
                      )}
                    </div>

                    {/* Attach Form */}
                    {selectedTask.status !== "COMPLETED" && (
                      <form
                        onSubmit={handleAddAttachment}
                        className="space-y-1.5 pt-1"
                      >
                        <Input
                          placeholder="File URL (e.g. https://...)"
                          value={attachmentUrl}
                          onChange={(e) => setAttachmentUrl(e.target.value)}
                          className="text-xs rounded-xl h-7 border-border bg-card focus-visible:ring-primary/40"
                        />
                        <div className="flex gap-1.5">
                          <Input
                            placeholder="Label (e.g. Filing Receipt)"
                            value={attachmentLabel}
                            onChange={(e) => setAttachmentLabel(e.target.value)}
                            className="text-xs rounded-xl h-7 border-border bg-card flex-1 focus-visible:ring-primary/40"
                          />
                          <Button
                            type="submit"
                            disabled={
                              isSubmittingAttachment || !attachmentUrl.trim()
                            }
                            className="h-7 px-2 text-xs font-bold rounded-xl"
                          >
                            {isSubmittingAttachment ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <span>Attach</span>
                            )}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-border/50">
                <Button
                  onClick={() => {
                    setIsDetailOpen(false);
                    setSelectedTask(null);
                  }}
                  className="rounded-xl text-sm font-bold"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Task Confirmation Dialog */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              Mark Task Completed
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Provide completion notes / proof summary to close this assignment.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitComplete(onCompleteSubmit)}
            className="space-y-4 py-2"
          >
            <div className="space-y-1">
              <Label
                htmlFor="completionNotes"
                className="text-xs font-bold text-foreground"
              >
                Completion Notes / Proof *
              </Label>
              <textarea
                id="completionNotes"
                placeholder="Describe what was done (e.g. suit successfully filed at West Division, copy attached...)"
                rows={3}
                {...registerComplete("completionNotes")}
                className="w-full text-sm p-3 rounded-xl border border-border bg-card text-foreground font-medium outline-none focus:border-primary focus-visible:ring-primary/40 resize-none"
              />
              {errorsComplete.completionNotes && (
                <p className="text-xs text-destructive font-semibold">
                  {errorsComplete.completionNotes.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCompleteOpen(false)}
                className="rounded-xl text-sm font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingComplete}
                className="skeuo-button-primary rounded-xl text-sm font-bold gap-1"
              >
                {isSubmittingComplete ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>Mark Complete</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
