import { Injectable } from "@nestjs/common";
import { UsersService } from "../../users/users.service";
import type {
  CreateFirmMemberDto,
  UpdateFirmMemberDto
} from "../../users/dto/firm-member.dto";
import type { UserEntity } from "../../users/entities/user.entity";

/**
 * `/associates` is the firm-facing view of the same user accounts `/users`
 * exposes. Both used to carry their own copy of create-and-list, and the two
 * had drifted: only this one set `mustChangePassword` or accepted a `name`,
 * and only this one defaulted the role. This module is now a thin delegation
 * layer over UsersService, which holds the single implementation.
 */
@Injectable()
export class AssociatesService {
  constructor(private readonly users: UsersService) {}

  create(firmId: string | null, dto: CreateFirmMemberDto): Promise<UserEntity> {
    return this.users.create(firmId, dto);
  }

  findAll(firmId: string | null): Promise<UserEntity[]> {
    return this.users.findAll(firmId);
  }

  findOne(firmId: string | null, id: string): Promise<UserEntity> {
    return this.users.findOne(firmId, id);
  }

  update(
    firmId: string | null,
    id: string,
    dto: UpdateFirmMemberDto
  ): Promise<UserEntity> {
    return this.users.update(firmId, id, dto);
  }
}
