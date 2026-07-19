import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FixedExpensesService } from './fixed-expenses.service';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';

@Controller('fixed-expenses')
export class FixedExpensesController {
  constructor(private readonly fixedExpensesService: FixedExpensesService) {}

  @Post()
  create(@Body() createFixedExpenseDto: CreateFixedExpenseDto) {
    return this.fixedExpensesService.create(createFixedExpenseDto);
  }

  @Get()
  findAll() {
    return this.fixedExpensesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fixedExpensesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFixedExpenseDto: UpdateFixedExpenseDto) {
    return this.fixedExpensesService.update(+id, updateFixedExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fixedExpensesService.remove(+id);
  }
}
