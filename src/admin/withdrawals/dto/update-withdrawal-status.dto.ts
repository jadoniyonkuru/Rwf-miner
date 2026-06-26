import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateWithdrawalStatusDto {
  @ApiProperty({ enum: ['COMPLETED', 'REJECTED'] })
  @IsEnum(['COMPLETED', 'REJECTED'])
  status: 'COMPLETED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
