import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreditBalanceDto {
  @ApiProperty({ example: 100, description: 'Positive to credit, negative to debit' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'Manual admin credit' })
  @IsString()
  @IsOptional()
  note?: string;
}
