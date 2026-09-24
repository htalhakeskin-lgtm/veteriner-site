import { ApiProperty } from '@nestjs/swagger';
import { Species } from '@prisma/client';
import {
  IsEmail, IsEnum, IsISO8601, IsOptional, IsString, Matches, MaxLength,
} from 'class-validator';

const PHONE_REGEX = /^(\+90|0)?\s?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  serviceId!: string;

  @ApiProperty({ required: false, description: 'Boş ise ilk müsait hekim atanır' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiProperty({ example: '2026-10-05T09:00:00+03:00' })
  @IsISO8601()
  startAt!: string;

  // ── Üye randevusu ──
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  petId?: string;

  // ── Misafir randevusu ──
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  guestName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Geçerli bir cep telefonu girin.' })
  guestPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin.' })
  guestEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  guestPetName?: string;

  @ApiProperty({ required: false, enum: Species })
  @IsOptional()
  @IsEnum(Species)
  guestPetSpecies?: Species;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CancelAppointmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2026-10-06T14:30:00+03:00' })
  @IsISO8601()
  startAt!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  staffId?: string;
}
