import { Test, TestingModule } from '@nestjs/testing';
import { AssociatesController } from './associates.controller';
import { AssociatesService } from './associates.service';

describe('AssociatesController', () => {
  let controller: AssociatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssociatesController],
      providers: [AssociatesService],
    }).compile();

    controller = module.get<AssociatesController>(AssociatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
