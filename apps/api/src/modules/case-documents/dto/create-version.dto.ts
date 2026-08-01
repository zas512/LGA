import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateVersionDto {
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @IsString()
  @IsOptional()
  changeNotes?: string;
}
