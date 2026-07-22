import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateAssociateDto } from "./dto/create-associate.dto";
import { UpdateAssociateDto } from "./dto/update-associate.dto";
import { UserRole } from "../../../generated/prisma/client";

@Injectable()
export class AssociatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(firmId: string | null, dto: CreateAssociateDto) {
    console.log(
      "[API AssociatesService.create] Creating user for firmId:",
      firmId,
      "Email:",
      dto.email
    );
    if (!firmId) {
      throw new BadRequestException("Administrator must belong to a firm");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    if (existingUser) {
      throw new ConflictException(
        "A user account with this email already exists"
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const assignedRole = dto.role || UserRole.ASSOCIATE;

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name || null,
        passwordHash,
        role: assignedRole,
        firmId,
        isActive: true,
        mustChangePassword: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        firmId: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        firm: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(
      "[API AssociatesService.create] User created successfully:",
      newUser.id
    );
    return newUser;
  }

  async findAll(firmId: string | null) {
    console.log(
      "[API AssociatesService.findAll] Incoming firmId from JWT:",
      firmId
    );
    if (!firmId) {
      throw new BadRequestException("Administrator must belong to a firm");
    }

    const members = await this.prisma.user.findMany({
      where: { firmId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        firmId: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        firm: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    console.log(
      `[API AssociatesService.findAll] Found ${members.length} members for firmId: ${firmId}`
    );
    return members;
  }

  async findOne(firmId: string | null, id: string) {
    console.log(
      "[API AssociatesService.findOne] Looking for user id:",
      id,
      "in firmId:",
      firmId
    );
    if (!firmId) {
      throw new BadRequestException("Administrator must belong to a firm");
    }

    const user = await this.prisma.user.findFirst({
      where: { id, firmId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        firmId: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        firm: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException("Firm member not found");
    }

    return user;
  }

  async update(firmId: string | null, id: string, dto: UpdateAssociateDto) {
    console.log(
      "[API AssociatesService.update] Updating user id:",
      id,
      "in firmId:",
      firmId
    );
    if (!firmId) {
      throw new BadRequestException("Administrator must belong to a firm");
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { id, firmId }
    });

    if (!existingUser) {
      throw new NotFoundException("Firm member not found");
    }

    const data: {
      email?: string;
      passwordHash?: string;
      role?: UserRole;
      isActive?: boolean;
      name?: string | null;
    } = {};

    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email }
      });
      if (emailExists) {
        throw new ConflictException(
          "A user account with this email already exists"
        );
      }
      data.email = dto.email;
    }

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.role) {
      data.role = dto.role;
    }

    if (typeof dto.isActive === "boolean") {
      data.isActive = dto.isActive;
    }

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        firmId: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        firm: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(
      "[API AssociatesService.update] User updated successfully:",
      updatedUser.id
    );
    return updatedUser;
  }
}
