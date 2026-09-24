import { ApiProperty } from '@nestjs/swagger';
import { Gender, RecordType, Species } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePetDto {
  @ApiProperty()
  @IsString()
  @MaxLength(60)
  name!: string;

  @ApiProperty({ enum: Species })
  @IsEnum(Species)
  species!: Species;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  breed?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  @ApiProperty({ required: false, enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  weightKg?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isNeutered?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  microchipNo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/** Güncellemede her alan isteğe bağlı. */
export class UpdatePetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  @ApiProperty({ required: false, enum: Species })
  @IsOptional()
  @IsEnum(Species)
  species?: Species;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  breed?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  @ApiProperty({ required: false, enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  weightKg?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isNeutered?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  microchipNo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateMedicalRecordDto {
  @ApiProperty()
  @IsString()
  petId!: string;

  @ApiProperty({ enum: RecordType })
  @IsEnum(RecordType)
  type!: RecordType;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty()
  @IsISO8601()
  performedAt!: string;

  @ApiProperty({ required: false, description: 'Aşı/kontrol tekrar tarihi' })
  @IsOptional()
  @IsISO8601()
  nextDueAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appointmentId?: string;
}
