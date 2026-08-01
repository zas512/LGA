import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { toEntities, toEntity } from "../../common/serialization/serialize";
import { BCRYPT_ROUNDS } from "../auth/auth.constants";
import { UserRole } from "../../generated/prisma/client";
import { CreateFirmDto } from "./dto/create-firm.dto";
import { FirmEntity } from "./entities/firm.entity";

@Injectable()
export class FirmsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<FirmEntity[]> {
    const firms = await this.prisma.firm.findMany({
      include: {
        users: {
          where: { role: UserRole.OWNER },
          select: { name: true, email: true },
          orderBy: { createdAt: "asc" },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return toEntities(
      FirmEntity,
      firms.map((firm) => ({
        id: firm.id,
        name: firm.name,
        createdAt: firm.createdAt,
        ownerName: firm.users[0]?.name ?? "N/A",
        ownerEmail: firm.users[0]?.email ?? "N/A"
      }))
    );
  }

  async create(dto: CreateFirmDto): Promise<FirmEntity> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.ownerEmail },
      select: { id: true }
    });
    if (existingUser) {
      throw new ConflictException(
        "A user account with this email already exists"
      );
    }

    const passwordHash = await bcrypt.hash(dto.ownerPassword, BCRYPT_ROUNDS);

    const { firm, user } = await this.prisma.$transaction(async (tx) => {
      const createdFirm = await tx.firm.create({ data: { name: dto.name } });
      const createdUser = await tx.user.create({
        data: {
          email: dto.ownerEmail,
          name: dto.ownerName,
          passwordHash,
          role: UserRole.OWNER,
          firmId: createdFirm.id,
          isActive: true,
          // The owner receives a provisioned password and must replace it.
          mustChangePassword: true
        },
        select: { name: true, email: true }
      });
      return { firm: createdFirm, user: createdUser };
    });

    return toEntity(FirmEntity, {
      id: firm.id,
      name: firm.name,
      createdAt: firm.createdAt,
      ownerName: user.name,
      ownerEmail: user.email
    });
  }
}
