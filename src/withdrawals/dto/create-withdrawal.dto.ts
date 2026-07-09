import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Length, Matches, Min, MinLength } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 50, description: 'Amount to withdraw in USDT' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', description: 'Destination address, phone number, or account number' })
  @IsString()
  @MinLength(5)
  address: string;

  @ApiProperty({ example: '123456', description: '6-digit withdrawal PIN' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'PIN must be exactly 6 digits' })
  pin: string;

  @ApiPropertyOptional({ description: 'Payment method ID selected by the user' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
