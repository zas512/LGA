import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../../prisma/prisma.module";
import { UsersModule } from "../../users/users.module";
import { MattersModule } from "../matters.module";
import { HearingsController } from "./hearings.controller";
import { HearingsService } from "./hearings.service";

@Module({
  imports: [PrismaModule, forwardRef(() => MattersModule), UsersModule],
  controllers: [HearingsController],
  providers: [HearingsService],
  exports: [HearingsService]
})
export class HearingsModule {}
