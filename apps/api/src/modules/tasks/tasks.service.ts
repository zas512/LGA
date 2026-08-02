import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { toEntities, toEntity } from "../../common/serialization/serialize";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { CreateTaskNoteDto, CreateTaskAttachmentDto } from "./dto/task-sub-actions.dto";
import { TaskEntity } from "./entities/task.entity";
import { TaskStatus, UserRole, Prisma } from "../../generated/prisma/client";

const TASK_SELECT = {
  id: true,
  firmId: true,
  matterId: true,
  hearingId: true,
  assignedById: true,
  assignedToId: true,
  title: true,
  description: true,
  taskType: true,
  status: true,
  priority: true,
  dueDate: true,
  estimatedHours: true,
  completionNotes: true,
  createdAt: true,
  updatedAt: true,
  notes: {
    select: {
      id: true,
      authorId: true,
      note: true,
      createdAt: true,
      author: {
        select: {
          fullName: true,
          email: true
        }
      }
    }
  },
  attachments: {
    select: {
      id: true,
      fileUrl: true,
      label: true,
      uploadedById: true,
      createdAt: true
    }
  },
  assignedTo: {
    select: {
      fullName: true,
      email: true
    }
  },
  assignedBy: {
    select: {
      fullName: true,
      email: true
    }
  }
} satisfies Prisma.TaskSelect;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    firmId: string,
    role: UserRole,
    callerAssociateId: string,
    dto: CreateTaskDto
  ): Promise<TaskEntity> {
    // 1. Role Check: Non-admin roles (ASSOCIATE) can only assign tasks to themselves
    if (role === UserRole.ASSOCIATE) {
      if (dto.assignedToId !== callerAssociateId) {
        throw new ForbiddenException(
          "Associates can only assign tasks to themselves"
        );
      }
    }

    // 2. Validate Matter if provided
    if (dto.matterId) {
      const matter = await this.prisma.matter.findFirst({
        where: { id: dto.matterId, firmId }
      });
      if (!matter) {
        throw new BadRequestException("Matter not found in your firm");
      }
    }

    // 3. Validate Hearing if provided
    if (dto.hearingId) {
      const hearing = await this.prisma.hearing.findFirst({
        where: { id: dto.hearingId, matter: { firmId } }
      });
      if (!hearing) {
        throw new BadRequestException("Hearing not found in your firm");
      }
    }

    const task = await this.prisma.task.create({
      data: {
        firmId,
        matterId: dto.matterId ?? null,
        hearingId: dto.hearingId ?? null,
        assignedById: callerAssociateId,
        assignedToId: dto.assignedToId,
        title: dto.title,
        description: dto.description ?? null,
        taskType: dto.taskType ?? null,
        priority: dto.priority ?? undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        estimatedHours: dto.estimatedHours ? new Prisma.Decimal(dto.estimatedHours) : null,
        status: TaskStatus.PENDING
      },
      select: TASK_SELECT
    });

    return toEntity(TaskEntity, task);
  }

  async findAll(
    firmId: string,
    role: UserRole,
    callerAssociateId: string,
    filters: { matterId?: string; status?: TaskStatus; assignedToId?: string }
  ): Promise<TaskEntity[]> {
    const where: Prisma.TaskWhereInput = { firmId };

    if (role === UserRole.ASSOCIATE) {
      // ASSOCIATE sees own tasks only (either assigned to them or created by them)
      where.OR = [
        { assignedToId: callerAssociateId },
        { assignedById: callerAssociateId }
      ];
    } else {
      // Apply filters if provided (for Admin/Owner)
      if (filters.assignedToId) {
        where.assignedToId = filters.assignedToId;
      }
    }

    if (filters.matterId) {
      where.matterId = filters.matterId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      select: TASK_SELECT,
      orderBy: { createdAt: "desc" }
    });

    return toEntities(TaskEntity, tasks);
  }

  async findOne(
    id: string,
    firmId: string,
    role: UserRole,
    callerAssociateId: string
  ): Promise<TaskEntity> {
    const task = await this.prisma.task.findFirst({
      where: { id, firmId },
      select: TASK_SELECT
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    if (role === UserRole.ASSOCIATE) {
      const isAssignee = task.assignedToId === callerAssociateId;
      const isCreator = task.assignedById === callerAssociateId;
      if (!isAssignee && !isCreator) {
        throw new ForbiddenException("Access denied to this task");
      }
    }

    return toEntity(TaskEntity, task);
  }

  async update(
    id: string,
    firmId: string,
    role: UserRole,
    callerAssociateId: string,
    dto: UpdateTaskDto
  ): Promise<TaskEntity> {
    const task = await this.prisma.task.findFirst({
      where: { id, firmId },
      select: { id: true, assignedToId: true, assignedById: true, status: true }
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    // Role Checks
    if (role === UserRole.ASSOCIATE) {
      const isAssignee = task.assignedToId === callerAssociateId;
      if (!isAssignee) {
        throw new ForbiddenException("You can only update your own tasks");
      }

      // If task is currently UNDER_REVIEW, an associate cannot change its status to COMPLETED directly without admin approval
      if (task.status === TaskStatus.UNDER_REVIEW && dto.status === TaskStatus.COMPLETED) {
        throw new ForbiddenException("Only administrators can approve and complete this task");
      }
    }

    const data: Prisma.TaskUpdateInput = {
      title: dto.title,
      description: dto.description,
      taskType: dto.taskType,
      status: dto.status,
      priority: dto.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      estimatedHours: dto.estimatedHours ? new Prisma.Decimal(dto.estimatedHours) : undefined,
      completionNotes: dto.completionNotes
    };

    const updated = await this.prisma.task.update({
      where: { id },
      data,
      select: TASK_SELECT
    });

    return toEntity(TaskEntity, updated);
  }

  async addNote(
    id: string,
    firmId: string,
    authorAssociateId: string,
    dto: CreateTaskNoteDto
  ): Promise<TaskEntity> {
    const task = await this.prisma.task.findFirst({
      where: { id, firmId },
      include: { matter: { include: { associates: true } } }
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    // Check comment visibility: assignee, assigner, or matter-assigned associates
    const isAssignee = task.assignedToId === authorAssociateId;
    const isCreator = task.assignedById === authorAssociateId;
    let isMatterAssigned = false;
    if (task.matter) {
      isMatterAssigned = task.matter.associates.some(
        (a) => a.associateId === authorAssociateId
      );
    }

    if (!isAssignee && !isCreator && !isMatterAssigned) {
      throw new ForbiddenException("You do not have visibility to comment on this task");
    }

    await this.prisma.taskNote.create({
      data: {
        taskId: id,
        authorId: authorAssociateId,
        note: dto.note
      }
    });

    const updated = await this.prisma.task.findFirstOrThrow({
      where: { id },
      select: TASK_SELECT
    });
    return toEntity(TaskEntity, updated);
  }

  async addAttachment(
    id: string,
    firmId: string,
    uploadedById: string,
    dto: CreateTaskAttachmentDto
  ): Promise<TaskEntity> {
    const task = await this.prisma.task.findFirst({
      where: { id, firmId },
      select: { id: true, assignedToId: true }
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    // Only assignee can upload proof of completion
    if (task.assignedToId !== uploadedById) {
      throw new ForbiddenException("Only the task assignee can upload proof of completion");
    }

    await this.prisma.taskAttachment.create({
      data: {
        taskId: id,
        fileUrl: dto.fileUrl,
        label: dto.label ?? null,
        uploadedById
      }
    });

    const updated = await this.prisma.task.findFirstOrThrow({
      where: { id },
      select: TASK_SELECT
    });
    return toEntity(TaskEntity, updated);
  }

  async complete(
    id: string,
    firmId: string,
    assigneeId: string,
    dto: UpdateTaskDto
  ): Promise<TaskEntity> {
    const task = await this.prisma.task.findFirst({
      where: { id, firmId },
      select: { id: true, assignedToId: true }
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    if (task.assignedToId !== assigneeId) {
      throw new ForbiddenException("Only the assignee can complete this task");
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completionNotes: dto.completionNotes ?? null
      },
      select: TASK_SELECT
    });

    return toEntity(TaskEntity, updated);
  }
}
