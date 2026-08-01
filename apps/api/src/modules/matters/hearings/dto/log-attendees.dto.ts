import { IsArray, IsUUID, IsNotEmpty } from "class-validator";

export class LogAttendeesDto {
  @IsArray()
  @IsUUID("all", { each: true })
  @IsNotEmpty()
  associateIds!: string[];
}
