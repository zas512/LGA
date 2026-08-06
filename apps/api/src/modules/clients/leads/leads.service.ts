import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { toEntities, toEntity } from "../../../common/serialization/serialize";
import { LeadStatus, Prisma } from "../../../generated/prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConvertLeadDto } from "./dto/convert-lead.dto";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { LeadEntity } from "./entities/lead.entity";

const LEAD_SELECT = {
  id: true,
  firmId: true,
  name: true,
  phone: true,
  email: true,
  cnic: true,
  practiceArea: true,
  source: true,
  description: true,
  status: true,
  assignedToId: true,
  convertedToClientId: true,
  convertedToMatterId: true,
  createdAt: true,
  updatedAt: true,
  assignedTo: {
    select: { id: true, fullName: true, email: true, designation: true }
  },
  convertedToClient: {
    select: { id: true, name: true, status: true }
  }
} satisfies Prisma.LeadSelect;

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(firmId: string, dto: CreateLeadDto): Promise<LeadEntity> {
    if (dto.assignedToId) {
      await this.assertAssociateInFirm(firmId, dto.assignedToId);
    }

    const lead = await this.prisma.lead.create({
      data: {
        firmId,
        name: dto.name,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        cnic: dto.cnic ?? null,
        practiceArea: dto.practiceArea ?? null,
        source: dto.source,
        description: dto.description ?? null,
        status: dto.status,
        assignedToId: dto.assignedToId ?? null
      },
      select: LEAD_SELECT
    });

    return toEntity(LeadEntity, lead);
  }

  async findAll(firmId: string, status?: LeadStatus): Promise<LeadEntity[]> {
    const where: Prisma.LeadWhereInput = { firmId };
    if (status) {
      where.status = status;
    }

    const leads = await this.prisma.lead.findMany({
      where,
      select: LEAD_SELECT,
      orderBy: { createdAt: "desc" }
    });

    return toEntities(LeadEntity, leads);
  }

  async findOne(firmId: string, id: string): Promise<LeadEntity> {
    const lead = await this.prisma.lead.findFirst({
      where: { id, firmId },
      select: LEAD_SELECT
    });
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
    return toEntity(LeadEntity, lead);
  }

  async update(
    firmId: string,
    id: string,
    dto: UpdateLeadDto
  ): Promise<LeadEntity> {
    await this.findOne(firmId, id);

    if (dto.assignedToId) {
      await this.assertAssociateInFirm(firmId, dto.assignedToId);
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        cnic: dto.cnic,
        practiceArea: dto.practiceArea,
        source: dto.source,
        description: dto.description,
        status: dto.status,
        assignedToId: dto.assignedToId
      },
      select: LEAD_SELECT
    });

    return toEntity(LeadEntity, updated);
  }

  /**
   * Convert an intake lead into a client (or link it to an existing client),
   * mark it CONVERTED, and log the conversion to the AuditLog. Idempotent: a
   * lead already converted returns unchanged. Matter creation stays on the
   * matters module, which now accepts the resulting clientId.
   */
  async convert(
    firmId: string,
    id: string,
    performedById: string,
    dto: ConvertLeadDto
  ): Promise<LeadEntity> {
    const lead = await this.findOne(firmId, id);
    if (lead.convertedToClientId) {
      return lead;
    }

    const converted = await this.prisma.$transaction(async (tx) => {
      let clientId = dto.clientId ?? null;

      if (clientId) {
        const client = await tx.client.findFirst({
          where: { id: clientId, firmId },
          select: { id: true }
        });
        if (!client) {
          throw new BadRequestException(
            "Client does not belong to your firm"
          );
        }
      } else {
        const client = await tx.client.create({
          data: {
            firmId,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            cnic: lead.cnic
          },
          select: { id: true }
        });
        clientId = client.id;
      }

      await tx.auditLog.create({
        data: {
          firmId,
          entityType: "Lead",
          entityId: id,
          action: "LEAD_CONVERTED",
          performedById,
          beforeState: { status: lead.status },
          afterState: { clientId }
        }
      });

      return tx.lead.update({
        where: { id },
        data: {
          status: LeadStatus.CONVERTED,
          convertedToClientId: clientId
        },
        select: LEAD_SELECT
      });
    });

    return toEntity(LeadEntity, converted);
  }

  private async assertAssociateInFirm(firmId: string, associateId: string) {
    const associate = await this.prisma.associate.findFirst({
      where: { id: associateId, firmId },
      select: { id: true }
    });
    if (!associate) {
      throw new BadRequestException("Associate does not belong to your firm");
    }
  }
}
