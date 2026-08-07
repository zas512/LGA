import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: "Current password is required" })
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: "New password must be at least 8 characters" })
  @MaxLength(72) // bcrypt silently truncates beyond 72 bytes
  newPassword!: string;
}
