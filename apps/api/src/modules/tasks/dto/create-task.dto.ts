import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, IsISO8601 } from "class-validator";
import { TaskType, TaskPriority } from "../../../generated/prisma/client";

export class CreateTaskDto {
  @IsUUID()
  @IsOptional()
  matterId?: string;

  @IsUUID()
  @IsOptional()
  hearingId?: string;

  @IsUUID()
  @IsNotEmpty()
  assignedToId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  @IsOptional()
  taskType?: TaskType;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsISO8601()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;
}
