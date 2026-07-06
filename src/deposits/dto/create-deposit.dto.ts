import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, MinLength } from 'class-validator';

export class CreateDepositDto {
  @ApiProperty({ example: 100, description: 'Deposit amount in USDT' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'abc123txhash...', description: 'Transaction hash or reference number' })
  @IsString()
  @MinLength(10)
  txHash: string;

  @ApiPropertyOptional({ description: 'Payment method ID selected by the user' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
