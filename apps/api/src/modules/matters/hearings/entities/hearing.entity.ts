import { Expose, Type } from "class-transformer";
import { HearingStatus } from "../../../../generated/prisma/client";

export class HearingAttendeeSummaryEntity {
  @Expose()
  id!: string;

  @Expose()
  associateId!: string;
}

export class HearingEntity {
  @Expose()
  id!: string;

  @Expose()
  matterId!: string;

  @Expose()
  hearingDate!: Date;

  @Expose()
  purpose!: string;

  @Expose()
  presidingJudge?: string | null;

  @Expose()
  proceedingsSummary?: string | null;

  @Expose()
  orderSheetUrl?: string | null;

  @Expose()
  nextDate?: Date | null;

  @Expose()
  nextPurpose?: string | null;

  @Expose()
  status!: HearingStatus;

  @Expose()
  createdById!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  @Type(() => HearingAttendeeSummaryEntity)
  attendees?: HearingAttendeeSummaryEntity[];
}
