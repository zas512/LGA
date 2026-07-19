import { Test, TestingModule } from '@nestjs/testing';
import { ManualExpensesService } from './manual-expenses.service';

describe('ManualExpensesService', () => {
  let service: ManualExpensesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManualExpensesService],
    }).compile();

    service = module.get<ManualExpensesService>(ManualExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
