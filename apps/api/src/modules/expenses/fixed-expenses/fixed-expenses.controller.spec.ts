import { Test, TestingModule } from '@nestjs/testing';
import { FixedExpensesController } from './fixed-expenses.controller';
import { FixedExpensesService } from './fixed-expenses.service';

describe('FixedExpensesController', () => {
  let controller: FixedExpensesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FixedExpensesController],
      providers: [FixedExpensesService],
    }).compile();

    controller = module.get<FixedExpensesController>(FixedExpensesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
