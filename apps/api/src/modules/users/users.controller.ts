import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateTeamMemberDto } from "./dto/create-team-member.dto";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/access-token.strategy";
import { UserRole } from "../../generated/prisma/client";

@Controller("users")
@UseGuards(AccessTokenGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  createTeamMember(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTeamMemberDto
  ) {
    return this.usersService.createTeamMember(user.firmId, dto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  getTeamMembers(@CurrentUser() user: JwtPayload) {
    return this.usersService.getTeamMembers(user.firmId);
  }
}
