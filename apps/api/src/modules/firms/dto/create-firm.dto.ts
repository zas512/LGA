import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateFirmDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @IsEmail({}, { message: "Please enter a valid email address" })
  @IsNotEmpty()
  ownerEmail: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @IsNotEmpty()
  ownerPassword: string;
}
