import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { FirmsService } from "./firms.service";
import { CreateFirmDto } from "./dto/create-firm.dto";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../../generated/prisma/client";

@Controller("firms")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class FirmsController {
  constructor(private readonly firmsService: FirmsService) {}

  @Get()
  findAll() {
    return this.firmsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateFirmDto) {
    return this.firmsService.create(dto);
  }
}
