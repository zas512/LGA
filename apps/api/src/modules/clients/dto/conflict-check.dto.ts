import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ConflictCheckDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  cnic?: string;
}
