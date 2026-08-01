import { Expose } from "class-transformer";

export class FirmEntity {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  ownerName: string;

  @Expose()
  ownerEmail: string;
}
