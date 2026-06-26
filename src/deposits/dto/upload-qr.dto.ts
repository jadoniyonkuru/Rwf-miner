import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UploadQrDto {
  @ApiProperty({ description: 'Base64-encoded QR code image (jpeg/png)' })
  @IsString()
  image: string;
}
