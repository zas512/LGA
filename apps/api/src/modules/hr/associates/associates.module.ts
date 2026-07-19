import { Module } from '@nestjs/common';
import { AssociatesService } from './associates.service';
import { AssociatesController } from './associates.controller';

@Module({
  controllers: [AssociatesController],
  providers: [AssociatesService],
})
export class AssociatesModule {}
