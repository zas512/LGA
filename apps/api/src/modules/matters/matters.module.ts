import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { MattersController } from "./matters.controller";
import { MattersService } from "./matters.service";
import { CourtStagesService } from "./court-stages/court-stages.service";
import { NotificationsService } from "./notifications.service";
import { PdfReportService } from "./pdf-report.service";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [MattersController],
  providers: [
    MattersService,
    CourtStagesService,
    NotificationsService,
    PdfReportService
  ],
  exports: [MattersService, NotificationsService, CourtStagesService]
})
export class MattersModule {}
