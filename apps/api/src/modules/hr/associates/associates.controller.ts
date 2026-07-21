import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards
} from "@nestjs/common";
import { AssociatesService } from "./associates.service";
import { CreateAssociateDto } from "./dto/create-associate.dto";
import { UpdateAssociateDto } from "./dto/update-associate.dto";
import { AccessTokenGuard } from "../../auth/guards/access-token.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../../auth/strategies/access-token.strategy";
import { UserRole } from "../../../generated/prisma/client";

@Controller("associates")
@UseGuards(AccessTokenGuard, RolesGuard)
export class AssociatesController {
  constructor(private readonly associatesService: AssociatesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAssociateDto
  ) {
    return this.associatesService.create(user.firmId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.associatesService.findAll(user.firmId);
  }

  @Get(":id")
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string
  ) {
    return this.associatesService.findOne(user.firmId, id);
  }

  @Patch(":id")
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateAssociateDto
  ) {
    return this.associatesService.update(user.firmId, id, dto);
  }
}
