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
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi girin.' })
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Gecerli bir cep telefonu girin.' })
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  subject!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10, { message: 'Mesaj en az 10 karakter olmali.' })
  @MaxLength(2000)
  message!: string;

  /**
   * Honeypot. Formda gizlidir; gercek kullanici gormez ve doldurmaz.
   * Botlar tum alanlari doldurdugu icin dolu gelmesi spam isaretidir.
   */
  @ApiProperty({ required: false, description: 'Doldurmayin (bot tuzagi)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class SubscribeDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi girin.' })
  email!: string;
}
