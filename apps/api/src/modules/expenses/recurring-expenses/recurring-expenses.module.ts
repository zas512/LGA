import { Module } from "@nestjs/common";
import { ExpensesModule } from "../expenses.module";
import { RecurringExpensesController } from "./recurring-expenses.controller";

@Module({
  imports: [ExpensesModule],
  controllers: [RecurringExpensesController]
})
export class RecurringExpensesModule {}
