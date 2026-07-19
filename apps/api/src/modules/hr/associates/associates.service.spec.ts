import { Test, TestingModule } from '@nestjs/testing';
import { AssociatesService } from './associates.service';

describe('AssociatesService', () => {
  let service: AssociatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssociatesService],
    }).compile();

    service = module.get<AssociatesService>(AssociatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
