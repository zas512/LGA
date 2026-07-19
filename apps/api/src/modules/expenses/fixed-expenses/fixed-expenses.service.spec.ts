import { Test, TestingModule } from '@nestjs/testing';
import { FixedExpensesService } from './fixed-expenses.service';

describe('FixedExpensesService', () => {
  let service: FixedExpensesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FixedExpensesService],
    }).compile();

    service = module.get<FixedExpensesService>(FixedExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
