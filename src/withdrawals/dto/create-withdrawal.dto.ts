import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length, Matches, Min, MinLength } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 50, description: 'Amount to withdraw in USDT' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', description: 'Destination TRC-20 wallet address' })
  @IsString()
  @MinLength(30)
  address: string;

  @ApiProperty({ example: '123456', description: '6-digit withdrawal PIN' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'PIN must be exactly 6 digits' })
  pin: string;
}
