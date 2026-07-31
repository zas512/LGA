import { OmitType, PartialType } from "@nestjs/mapped-types";
import { IsISO8601, IsOptional, ValidateIf } from "class-validator";
import { CreateAttendanceDto } from "./create-attendance.dto";

/**
 * `checkOut` is omitted from the inherited shape and redeclared so it can also
 * accept an explicit `null`, which the edit dialog sends to reopen a shift.
 */
export class UpdateAttendanceDto extends PartialType(
  OmitType(CreateAttendanceDto, ["checkOut"] as const)
) {
  @ValidateIf((dto: UpdateAttendanceDto) => dto.checkOut !== null)
  @IsISO8601()
  @IsOptional()
  checkOut?: string | null;
}
