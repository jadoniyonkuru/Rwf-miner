import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateDepositDto {
  @ApiProperty({ example: 100, description: 'Deposit amount in USDT' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'abc123txhash...', description: 'TRC-20 transaction hash (TxID)' })
  @IsString()
  @MinLength(10)
  txHash: string;
}
