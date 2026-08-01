import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  ForbiddenException
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/access-token.strategy";
import { TaskStatus } from "../../generated/prisma/client.js";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import {
  CreateTaskNoteDto,
  CreateTaskAttachmentDto
} from "./dto/task-sub-actions.dto";
import { TasksService } from "./tasks.service";
import { TaskEntity } from "./entities/task.entity";
import { UsersService } from "../users/users.service";

@Controller("tasks")
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService
  ) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTaskDto
  ): Promise<TaskEntity> {
    if (!user.firmId) {
      throw new ForbiddenException("Must belong to a firm");
    }
    const associateId = await this.usersService.resolveAssociateId(user.sub);
    return this.tasksService.create(user.firmId, user.role, associateId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query("matterId") matterId?: string,
    @Query("status") status?: TaskStatus,
    @Query("assignedToId") assignedToId?: string
  ): Promise<TaskEntity[]> {
    if (!user.firmId) {
      throw new ForbiddenException("Must belong to a firm");
    }
    const associateId = await this.usersService.resolveAssociateId(user.sub);
    return this.tasksService.findAll(user.firmId, user.role, associateId, {
      matterId,
      status,
      assignedToId
    });
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<TaskEntity> {
    if (!user.firmId) {
      throw new ForbiddenException("Must belong to a firm");
    }
    const associateId = await this.usersService.resolveAssociateId(user.sub);
    return this.tasksService.findOne(id, user.firmId, user.role, associateId);
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTaskDto
  ): Promise<TaskEntity> {
    if (!user.firmId) {
      throw new ForbiddenException("Must belong to a firm");
    }
    const associateId = await this.usersService.resolveAssociateId(user.sub);
    return this.tasksService.update(
      id,
      user.firmId,
      user.role,
      associateId,
      dto
    );
  }

  @Post(":id/notes")
  async addNote(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTaskNoteDto
  ): Promise<TaskEntity> {
    if (!user.firmId) {
      throw new ForbiddenException("Must belong to a firm");
    }
    const associateId = await this.usersService.resolveAssociateId(user.sub);
    return this.tasksService.addNote(id, user.firmId, associateId, dto);
  }

  @Post(":id/attachments")
  async addAttachment(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTaskAttachmentDto
  ): Promise<TaskEntity> {
    if (!user.firmId) {
      throw new ForbiddenException("Must belong to a firm");
    }
    const associateId = await this.usersService.resolveAssociateId(user.sub);
    return this.tasksService.addAttachment(id, user.firmId, associateId, dto);
  }

  @Patch(":id/complete")
  async complete(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTaskDto
  ): Promise<TaskEntity> {
    if (!user.firmId) {
      throw new ForbiddenException("Must belong to a firm");
    }
    const associateId = await this.usersService.resolveAssociateId(user.sub);
    return this.tasksService.complete(id, user.firmId, associateId, dto);
  }
}
