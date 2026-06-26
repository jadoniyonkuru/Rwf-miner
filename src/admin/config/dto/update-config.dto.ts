import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateConfigDto {
  @ApiPropertyOptional({ example: 'TELEXuLxzbW6ejKTL6qKJE48UA3LQDaBo' })
  @IsString()
  @IsOptional()
  depositAddress?: string;

  @ApiPropertyOptional({ description: 'Default QR code as Base64 image' })
  @IsString()
  @IsOptional()
  defaultQr?: string;

  @ApiPropertyOptional({ example: 'https://wa.me/250780000000' })
  @IsString()
  @IsOptional()
  whatsappLink?: string;

  @ApiPropertyOptional({ example: 'https://t.me/rwfminer' })
  @IsString()
  @IsOptional()
  telegramLink?: string;

  @ApiPropertyOptional({ example: 0.005, description: 'Daily mining rate (e.g. 0.005 = 0.5%)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  miningDailyRate?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minDeposit?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minWithdrawal?: number;
}
