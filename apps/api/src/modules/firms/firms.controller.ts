import { Body, Controller, Get, Post } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../../generated/prisma/client";
import { CreateFirmDto } from "./dto/create-firm.dto";
import { FirmEntity } from "./entities/firm.entity";
import { FirmsService } from "./firms.service";

/** Platform administration; authentication comes from the global guards. */
@Controller("firms")
@Roles(UserRole.SUPER_ADMIN)
export class FirmsController {
  constructor(private readonly firmsService: FirmsService) {}

  @Get()
  findAll(): Promise<FirmEntity[]> {
    return this.firmsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateFirmDto): Promise<FirmEntity> {
    return this.firmsService.create(dto);
  }
}
