import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateFirmDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(trim)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(trim)
  ownerName: string;

  @IsEmail({}, { message: "Please enter a valid email address" })
  @IsNotEmpty()
  @Transform(trim)
  ownerEmail: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(72) // bcrypt silently truncates beyond 72 bytes
  @IsNotEmpty()
  ownerPassword: string;
}
