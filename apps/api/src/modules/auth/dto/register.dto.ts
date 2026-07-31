import { Transform } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from "class-validator";
import { UserRole } from "../../../generated/prisma/client";

export class RegisterDto {
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value
  )
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt silently truncates beyond 72 bytes
  password!: string;

  /**
   * Only OWNER is accepted; the enum is kept so an explicit role still yields a
   * 400 rather than a confusing 403 from the service.
   */
  @IsEnum(UserRole)
  role!: UserRole;

  /**
   * Required for the OWNER flow. `@IsOptional()` used to sit next to the
   * `@ValidateIf` here, which cancelled it out and pushed the check into the
   * service.
   */
  @IsString()
  @IsNotEmpty({ message: "firmName is required when registering a firm owner" })
  firmName!: string;

  @IsString()
  @IsOptional()
  name?: string;
}
