import { Module } from "@nestjs/common";
import { FirmsService } from "./firms.service";
import { FirmsController } from "./firms.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [FirmsController],
  providers: [FirmsService],
  exports: [FirmsService]
})
export class FirmsModule {}
