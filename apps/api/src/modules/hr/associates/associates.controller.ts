import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AssociatesService } from './associates.service';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { UpdateAssociateDto } from './dto/update-associate.dto';

@Controller('associates')
export class AssociatesController {
  constructor(private readonly associatesService: AssociatesService) {}

  @Post()
  create(@Body() createAssociateDto: CreateAssociateDto) {
    return this.associatesService.create(createAssociateDto);
  }

  @Get()
  findAll() {
    return this.associatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.associatesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssociateDto: UpdateAssociateDto) {
    return this.associatesService.update(+id, updateAssociateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.associatesService.remove(+id);
  }
}
