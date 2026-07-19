import { Module } from '@nestjs/common';
import { ManualExpensesService } from './manual-expenses.service';
import { ManualExpensesController } from './manual-expenses.controller';

@Module({
  controllers: [ManualExpensesController],
  providers: [ManualExpensesService],
})
export class ManualExpensesModule {}
