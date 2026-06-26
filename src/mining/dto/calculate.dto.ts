import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CalculateDto {
  @ApiProperty({ example: 500, description: 'Investment amount in USDT' })
  @IsNumber()
  @Min(1)
  amount: number;
}
