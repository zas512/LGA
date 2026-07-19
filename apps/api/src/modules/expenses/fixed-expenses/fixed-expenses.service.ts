import { Injectable } from '@nestjs/common';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';

@Injectable()
export class FixedExpensesService {
  create(createFixedExpenseDto: CreateFixedExpenseDto) {
    return 'This action adds a new fixedExpense';
  }

  findAll() {
    return `This action returns all fixedExpenses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fixedExpense`;
  }

  update(id: number, updateFixedExpenseDto: UpdateFixedExpenseDto) {
    return `This action updates a #${id} fixedExpense`;
  }

  remove(id: number) {
    return `This action removes a #${id} fixedExpense`;
  }
}
