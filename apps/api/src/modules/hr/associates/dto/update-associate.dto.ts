import { PartialType } from "@nestjs/mapped-types";
import { IsBoolean, IsOptional } from "class-validator";
import { CreateAssociateDto } from "./create-associate.dto";

export class UpdateAssociateDto extends PartialType(CreateAssociateDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

