import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'USDT TRC-20' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'CRYPTO', enum: ['CRYPTO', 'MOBILE_MONEY', 'BANK'] })
  @IsOptional() @IsIn(['CRYPTO', 'MOBILE_MONEY', 'BANK'])
  type?: string;

  @ApiProperty({ example: 'TJbGGr5bXSWBr1HXzqj1HoZxNv3EXqT5bN' })
  @IsString() @IsNotEmpty()
  accountNumber: string;

  @ApiPropertyOptional({ example: 'Send USDT (TRC-20) to the address above and paste your txHash.' })
  @IsOptional() @IsString()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Base64-encoded QR image' })
  @IsOptional() @IsString()
  qrCode?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
