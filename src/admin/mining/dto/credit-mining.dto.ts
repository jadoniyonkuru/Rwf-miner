import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreditMiningDto {
  @ApiProperty({ example: 5.5, description: 'Mining earning amount in USDT' })
  @IsNumber()
  @Min(0.00000001)
  amount: number;

  @ApiPropertyOptional({ example: 'user-id-here', description: 'Target user ID. Omit to credit all users.' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: 'Daily mining reward' })
  @IsString()
  @IsOptional()
  note?: string;
}
