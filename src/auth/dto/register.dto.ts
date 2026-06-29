import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;

  @ApiPropertyOptional({ example: 'KANA6992', description: 'Referral code from an existing user' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{6,10}$/, { message: 'Invalid referral code format' })
  referralCode?: string;
}
