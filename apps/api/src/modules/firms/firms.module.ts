import { Module } from "@nestjs/common";
import { FirmsController } from "./firms.controller";
import { FirmsService } from "./firms.service";

@Module({
  // PrismaModule is @Global(), so it does not need to be imported here.
  controllers: [FirmsController],
  providers: [FirmsService],
  exports: [FirmsService]
})
export class FirmsModule {}
