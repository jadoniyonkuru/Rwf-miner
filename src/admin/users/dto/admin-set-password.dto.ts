import { ApiProperty } from '@nestjs/swagger';
import { MinLength } from 'class-validator';

export class AdminSetPasswordDto {
  @ApiProperty({ minLength: 8 })
  @MinLength(8)
  password: string;
}
