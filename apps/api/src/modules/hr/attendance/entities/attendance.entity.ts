import { Expose } from "class-transformer";
import type {
  AttendanceSource,
  AttendanceStatus
} from "../../../../generated/prisma/client";

export class AttendanceEntity {
  @Expose()
  id: string;

  @Expose()
  associateId: string;

  @Expose()
  date: Date;

  @Expose()
  checkIn: Date | null;

  @Expose()
  checkOut: Date | null;

  @Expose()
  status: AttendanceStatus;

  @Expose()
  source: AttendanceSource;

  @Expose()
  notes: string | null;

  @Expose()
  createdAt: Date;
}
