import { IsOptional, IsUUID } from "class-validator";

export class ConvertLeadDto {
  /**
   * Optional: link the lead to an existing firm client instead of creating a
   * new Client from the lead's name/contact fields.
   */
  @IsUUID()
  @IsOptional()
  clientId?: string;
}
