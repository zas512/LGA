import {
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min
} from "class-validator";

/**
 * Shared fields for both FIXED and MANUAL expense creation. The two module
 * DTOs (`create-fixed-expense.dto`, `create-manual-expense.dto`) extend this
 * so the `ValidationPipe`'s `forbidNonWhitelisted` accepts exactly these.
 */
export class CreateExpenseDto {
  @IsString()
  @MaxLength(100)
  category!: string;

  @IsString()
  @MaxLength(300)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  /** Calendar day, `YYYY-MM-DD`. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date must be YYYY-MM-DD" })
  date!: string;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  vendor?: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  paymentMethod?: string;

  @IsUrl()
  @MaxLength(500)
  @IsOptional()
  receiptUrl?: string;

  @IsUUID()
  @IsOptional()
  associateId?: string;
}
