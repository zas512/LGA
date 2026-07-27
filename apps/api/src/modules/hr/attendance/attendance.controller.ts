import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/strategies/access-token.strategy';
import { AttendanceStatus } from '../../../generated/prisma/client';

@Controller('attendance')
@UseGuards(AccessTokenGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.attendanceService.findAllForUser(user);
  }

  @Post('check-in')
  checkIn(
    @CurrentUser() user: JwtPayload,
    @Body('notes') notes?: string
  ) {
    return this.attendanceService.checkIn(user, notes);
  }

  @Post('check-out')
  checkOut(
    @CurrentUser() user: JwtPayload,
    @Body('notes') notes?: string
  ) {
    return this.attendanceService.checkOut(user, notes);
  }

  @Post('manual')
  createManual(
    @CurrentUser() user: JwtPayload,
    @Body() body: { date: string; checkIn: string; checkOut: string; status: AttendanceStatus; notes?: string }
  ) {
    return this.attendanceService.createManual(user, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { date?: string; checkIn?: string; checkOut?: string; status?: AttendanceStatus; notes?: string }
  ) {
    return this.attendanceService.update(user, id, body);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string
  ) {
    return this.attendanceService.remove(user, id);
  }
}
