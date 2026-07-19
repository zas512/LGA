import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ManualExpensesService } from './manual-expenses.service';
import { CreateManualExpenseDto } from './dto/create-manual-expense.dto';
import { UpdateManualExpenseDto } from './dto/update-manual-expense.dto';

@Controller('manual-expenses')
export class ManualExpensesController {
  constructor(private readonly manualExpensesService: ManualExpensesService) {}

  @Post()
  create(@Body() createManualExpenseDto: CreateManualExpenseDto) {
    return this.manualExpensesService.create(createManualExpenseDto);
  }

  @Get()
  findAll() {
    return this.manualExpensesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.manualExpensesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateManualExpenseDto: UpdateManualExpenseDto) {
    return this.manualExpensesService.update(+id, updateManualExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.manualExpensesService.remove(+id);
  }
}
