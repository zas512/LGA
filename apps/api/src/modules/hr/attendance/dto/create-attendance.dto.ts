import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength
} from "class-validator";
import { AttendanceStatus } from "../../../../generated/prisma/client";

/**
 * These payloads used to be declared inline on the controller as
 * `@Body() body: { date: string; ... }`. Because the global ValidationPipe
 * skips a metatype of `Object`, nothing was validated and the raw strings went
 * straight into `new Date(...)` and Prisma.
 */
export class CheckInDto {
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}

export class CreateAttendanceDto {
  /** Calendar day, `YYYY-MM-DD`. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date must be YYYY-MM-DD" })
  date!: string;

  @IsISO8601()
  checkIn!: string;

  @IsISO8601()
  checkOut!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}
