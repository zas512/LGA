import { Injectable } from '@nestjs/common';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { UpdateAssociateDto } from './dto/update-associate.dto';

@Injectable()
export class AssociatesService {
  create(createAssociateDto: CreateAssociateDto) {
    return 'This action adds a new associate';
  }

  findAll() {
    return `This action returns all associates`;
  }

  findOne(id: number) {
    return `This action returns a #${id} associate`;
  }

  update(id: number, updateAssociateDto: UpdateAssociateDto) {
    return `This action updates a #${id} associate`;
  }

  remove(id: number) {
    return `This action removes a #${id} associate`;
  }
}
