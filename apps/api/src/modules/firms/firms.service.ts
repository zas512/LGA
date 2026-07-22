import { Injectable, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateFirmDto } from "./dto/create-firm.dto";
import { UserRole } from "../../generated/prisma/client";

@Injectable()
export class FirmsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const firms = await this.prisma.firm.findMany({
      include: {
        users: {
          where: {
            role: UserRole.OWNER
          },
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return firms.map((firm) => ({
      id: firm.id,
      name: firm.name,
      createdAt: firm.createdAt,
      ownerName: firm.users[0]?.name || "N/A",
      ownerEmail: firm.users[0]?.email || "N/A"
    }));
  }

  async create(dto: CreateFirmDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.ownerEmail }
    });
    if (existingUser) {
      throw new ConflictException("A user account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const firm = await tx.firm.create({
        data: { name: dto.name }
      });

      const user = await tx.user.create({
        data: {
          email: dto.ownerEmail,
          name: dto.ownerName,
          passwordHash,
          role: UserRole.OWNER,
          firmId: firm.id,
          isActive: true
        }
      });

      return { firm, user };
    });

    return {
      id: result.firm.id,
      name: result.firm.name,
      createdAt: result.firm.createdAt,
      ownerName: result.user.name,
      ownerEmail: result.user.email
    };
  }
}
