import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../../prisma/prisma.module";
import { MattersModule } from "../matters.module";
import { HearingsController } from "./hearings.controller";
import { HearingsService } from "./hearings.service";

@Module({
  imports: [PrismaModule, forwardRef(() => MattersModule)],
  controllers: [HearingsController],
  providers: [HearingsService],
  exports: [HearingsService]
})
export class HearingsModule {}
