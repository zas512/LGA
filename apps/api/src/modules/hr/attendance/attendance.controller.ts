import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post
} from "@nestjs/common";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../../auth/strategies/access-token.strategy";
import { AttendanceService } from "./attendance.service";
import { CheckInDto, CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";
import { AttendanceEntity } from "./entities/attendance.entity";

/**
 * Every route is scoped to the caller's own associate record, so no `@Roles()`
 * requirement is needed beyond the global authentication guard.
 */
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload): Promise<AttendanceEntity[]> {
    return this.attendanceService.findAllForUser(user);
  }

  @Post("check-in")
  checkIn(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CheckInDto
  ): Promise<AttendanceEntity> {
    return this.attendanceService.checkIn(user, dto);
  }

  @Post("check-out")
  checkOut(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CheckInDto
  ): Promise<AttendanceEntity> {
    return this.attendanceService.checkOut(user, dto);
  }

  @Post("manual")
  createManual(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAttendanceDto
  ): Promise<AttendanceEntity> {
    return this.attendanceService.createManual(user, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto
  ): Promise<AttendanceEntity> {
    return this.attendanceService.update(user, id, dto);
  }

  @Delete(":id")
  remove(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<AttendanceEntity> {
    return this.attendanceService.remove(user, id);
  }
}
