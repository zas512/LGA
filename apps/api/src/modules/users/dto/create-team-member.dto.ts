import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";
import { UserRole } from "../../../generated/prisma/client";

export class CreateTeamMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
