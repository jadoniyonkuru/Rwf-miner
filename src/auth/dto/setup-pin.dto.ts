import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class SetupPinDto {
  @ApiProperty({ example: '123456', description: '6-digit numeric PIN' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'PIN must be exactly 6 digits' })
  pin: string;

  @ApiProperty({ example: '123456', description: 'Confirm the PIN' })
  @IsString()
  @Length(6, 6)
  confirmPin: string;
}
