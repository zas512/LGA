import { Module } from "@nestjs/common";
import { ExpensesModule } from "../expenses.module";
import { ManualExpensesController } from "./manual-expenses.controller";
import { ManualExpensesService } from "./manual-expenses.service";

@Module({
  imports: [ExpensesModule],
  controllers: [ManualExpensesController],
  providers: [ManualExpensesService]
})
export class ManualExpensesModule {}
