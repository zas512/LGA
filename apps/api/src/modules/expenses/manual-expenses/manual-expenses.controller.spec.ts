import { Test, TestingModule } from '@nestjs/testing';
import { ManualExpensesController } from './manual-expenses.controller';
import { ManualExpensesService } from './manual-expenses.service';

describe('ManualExpensesController', () => {
  let controller: ManualExpensesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManualExpensesController],
      providers: [ManualExpensesService],
    }).compile();

    controller = module.get<ManualExpensesController>(ManualExpensesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
