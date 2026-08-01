import { Module } from "@nestjs/common";
import { UsersModule } from "../../users/users.module";
import { AttendanceController } from "./attendance.controller";
import { AttendanceService } from "./attendance.service";

@Module({
  // Needed for UsersService.resolveAssociateId, which links a user account to
  // its HR Associate record.
  imports: [UsersModule],
  controllers: [AttendanceController],
  providers: [AttendanceService]
})
export class AttendanceModule {}
