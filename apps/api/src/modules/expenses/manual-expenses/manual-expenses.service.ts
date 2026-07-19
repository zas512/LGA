import { Injectable } from '@nestjs/common';
import { CreateManualExpenseDto } from './dto/create-manual-expense.dto';
import { UpdateManualExpenseDto } from './dto/update-manual-expense.dto';

@Injectable()
export class ManualExpensesService {
  create(createManualExpenseDto: CreateManualExpenseDto) {
    return 'This action adds a new manualExpense';
  }

  findAll() {
    return `This action returns all manualExpenses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} manualExpense`;
  }

  update(id: number, updateManualExpenseDto: UpdateManualExpenseDto) {
    return `This action updates a #${id} manualExpense`;
  }

  remove(id: number) {
    return `This action removes a #${id} manualExpense`;
  }
}
