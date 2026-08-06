import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { LeadsController } from "./leads/leads.controller";
import { LeadsService } from "./leads/leads.service";

@Module({
  imports: [UsersModule],
  controllers: [ClientsController, LeadsController],
  providers: [ClientsService, LeadsService],
  exports: [ClientsService]
})
export class ClientsModule {}
