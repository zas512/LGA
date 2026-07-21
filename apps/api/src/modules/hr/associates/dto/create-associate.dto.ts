import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength
} from "class-validator";
import { UserRole } from "../../../../generated/prisma/client";

export class CreateAssociateDto {
  @IsEmail({}, { message: "Please enter a valid email address" })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @IsNotEmpty()
  password: string;

  @IsEnum(UserRole, { message: "Role must be ADMIN or ASSOCIATE" })
  @IsOptional()
  role?: UserRole;
}
