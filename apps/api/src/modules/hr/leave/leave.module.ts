import { Module } from "@nestjs/common";
import { PrismaModule } from "../../../prisma/prisma.module";
import { UsersModule } from "../../users/users.module";
import { LeaveService } from "./leave.service";
import { LeaveController } from "./leave.controller";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [LeaveController],
  providers: [LeaveService]
})
export class LeaveModule {}
