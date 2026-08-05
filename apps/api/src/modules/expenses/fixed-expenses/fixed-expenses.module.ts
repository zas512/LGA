import { Module } from "@nestjs/common";
import { ExpensesModule } from "../expenses.module";
import { FixedExpensesController } from "./fixed-expenses.controller";
import { FixedExpensesService } from "./fixed-expenses.service";

@Module({
  imports: [ExpensesModule],
  controllers: [FixedExpensesController],
  providers: [FixedExpensesService]
})
export class FixedExpensesModule {}
