import { Module } from "@nestjs/common";
import { UsersModule } from "../../users/users.module";
import { AssociatesController } from "./associates.controller";
import { AssociatesService } from "./associates.service";

@Module({
  // UsersService owns firm-member persistence; this module only re-exposes it
  // under the /associates route.
  imports: [UsersModule],
  controllers: [AssociatesController],
  providers: [AssociatesService]
})
export class AssociatesModule {}
