import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DepositStatus } from '@prisma/client';

export class UpdateDepositStatusDto {
  @ApiProperty({ enum: ['CONFIRMED', 'REJECTED'] })
  @IsEnum(['CONFIRMED', 'REJECTED'])
  status: 'CONFIRMED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
