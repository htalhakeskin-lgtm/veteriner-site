import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const PHONE_REGEX = /^(\+90|0)?\s?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

export class ContactMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin.' })
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Geçerli bir cep telefonu girin.' })
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  subject!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10, { message: 'Mesaj en az 10 karakter olmalı.' })
  @MaxLength(2000)
  message!: string;

  /**
   * Honeypot. Formda gizlidir; gerçek kullanıcı görmez ve doldurmaz.
   * Botlar tüm alanları doldurduğu için dolu gelmesi spam işaretidir.
   */
  @ApiProperty({ required: false, description: 'Doldurmayın (bot tuzağı)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class SubscribeDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin.' })
  email!: string;
}
