import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Turkiye telefon formatlari: 05xx xxx xx xx / +905xxxxxxxxx / bosluklu */
const PHONE_REGEX = /^(\+90|0)?\s?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

export class RegisterDto {
  @ApiProperty({ example: 'ayse@ornek.com' })
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi girin.' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Ayse Kara' })
  @IsString()
  @MinLength(2, { message: 'Ad soyad en az 2 karakter olmali.' })
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: '0532 111 22 33', required: false })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Gecerli bir cep telefonu girin.' })
  phone?: string;

  @ApiProperty({ example: 'en-az-8-karakter', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Sifre en az 8 karakter olmali.' })
  @MaxLength(128)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'musteri@demo.com' })
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi girin.' })
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MaxLength(128)
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'musteri@demo.com' })
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi girin.' })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(256)
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Sifre en az 8 karakter olmali.' })
  @MaxLength(128)
  password!: string;
}
