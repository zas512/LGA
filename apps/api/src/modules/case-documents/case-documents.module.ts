import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { MattersModule } from "../matters/matters.module";
import { CaseDocumentsController } from "./case-documents.controller";
import { CaseDocumentsService } from "./case-documents.service";

@Module({
  imports: [PrismaModule, forwardRef(() => MattersModule), UsersModule],
  controllers: [CaseDocumentsController],
  providers: [CaseDocumentsService],
  exports: [CaseDocumentsService]
})
export class CaseDocumentsModule {}
