import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTaskNoteDto {
  @IsString()
  @IsNotEmpty()
  note!: string;
}

export class CreateTaskAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @IsString()
  @IsOptional()
  label?: string;
}
