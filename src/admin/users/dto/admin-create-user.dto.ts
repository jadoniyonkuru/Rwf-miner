import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, MinLength } from 'class-validator';

export class AdminCreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}
