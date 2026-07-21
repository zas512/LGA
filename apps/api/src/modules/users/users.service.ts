import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTeamMemberDto } from "./dto/create-team-member.dto";
import { UserRole } from "../../generated/prisma/client";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createTeamMember(firmId: string | null, dto: CreateTeamMemberDto) {
    if (!firmId) {
      throw new BadRequestException(
        "Administrator must belong to a firm to add team members"
      );
    }
    if (dto.role === UserRole.SUPER_ADMIN || dto.role === UserRole.OWNER) {
      throw new ForbiddenException(
        "Team members can only be assigned ADMIN or ASSOCIATE roles"
      );
    }
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    if (existing) {
      throw new ConflictException("A user with this email already exists");
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        firmId
      },
      select: {
        id: true,
        email: true,
        role: true,
        firmId: true,
        isActive: true,
        createdAt: true
      }
    });
  }

  async getTeamMembers(firmId: string | null) {
    if (!firmId) {
      throw new BadRequestException("Administrator must belong to a firm");
    }
    return this.prisma.user.findMany({
      where: { firmId },
      select: {
        id: true,
        email: true,
        role: true,
        firmId: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
  }
}
