import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf
} from "class-validator";
import { UserRole } from "../../../generated/prisma/client";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @ValidateIf((dto: RegisterDto) => dto.role === UserRole.OWNER)
  @IsString()
  @IsOptional()
  firmName?: string;
}
