import { Expose, Type } from "class-transformer";
import {
  TaskType,
  TaskStatus,
  TaskPriority
} from "../../../generated/prisma/client";

export class TaskNoteSummaryEntity {
  @Expose()
  id!: string;

  @Expose()
  authorId!: string;

  @Expose()
  note!: string;

  @Expose()
  createdAt!: Date;
}

export class TaskAttachmentSummaryEntity {
  @Expose()
  id!: string;

  @Expose()
  fileUrl!: string;

  @Expose()
  label?: string | null;

  @Expose()
  uploadedById!: string;

  @Expose()
  createdAt!: Date;
}

export class TaskEntity {
  @Expose()
  id!: string;

  @Expose()
  firmId!: string;

  @Expose()
  matterId?: string | null;

  @Expose()
  hearingId?: string | null;

  @Expose()
  assignedById!: string;

  @Expose()
  assignedToId!: string;

  @Expose()
  title!: string;

  @Expose()
  description?: string | null;

  @Expose()
  taskType?: TaskType | null;

  @Expose()
  status!: TaskStatus;

  @Expose()
  priority!: TaskPriority;

  @Expose()
  dueDate?: Date | null;

  @Expose()
  estimatedHours?: number | null;

  @Expose()
  completionNotes?: string | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  get isOverdue(): boolean {
    const overdueStatuses: TaskStatus[] = [
      TaskStatus.PENDING,
      TaskStatus.IN_PROGRESS,
      TaskStatus.UNDER_REVIEW
    ];
    if (this.dueDate && overdueStatuses.includes(this.status)) {
      return new Date(this.dueDate).getTime() < Date.now();
    }
    return false;
  }

  @Expose()
  @Type(() => TaskNoteSummaryEntity)
  notes?: TaskNoteSummaryEntity[];

  @Expose()
  @Type(() => TaskAttachmentSummaryEntity)
  attachments?: TaskAttachmentSummaryEntity[];
}
