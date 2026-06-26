import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class BulkApproveDto {
  @ApiProperty({ type: [String], description: 'Array of deposit IDs to approve' })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
