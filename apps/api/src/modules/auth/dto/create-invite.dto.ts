import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsOptional } from "class-validator";
import {
  FIRM_MEMBER_ROLES,
  type FirmMemberRole
} from "../../users/dto/firm-member.dto";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

/**
 * Member invite: joins an existing firm as ADMIN or ASSOCIATE. Founder invites
 * (create a new firm as OWNER) take no body and are issued by a SUPER_ADMIN.
 */
export class CreateInviteDto {
  @IsEmail({}, { message: "Please enter a valid email address" })
  @Transform(trim)
  email!: string;

  @IsIn(FIRM_MEMBER_ROLES, { message: "Role must be ADMIN or ASSOCIATE" })
  @IsOptional()
  role?: FirmMemberRole;
}
