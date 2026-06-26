import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class BulkApproveWithdrawalsDto {
  @ApiProperty({ type: [String], description: 'Array of withdrawal IDs to approve' })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
