import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupportService } from './support.service';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('links')
  @ApiOperation({ summary: 'Get WhatsApp and Telegram support links (no auth required)' })
  @ApiResponse({
    status: 200,
    description: 'Support contact links',
    schema: {
      example: {
        data: {
          whatsapp: 'https://wa.me/250xxxxxxxxx',
          telegram: 'https://t.me/rwfminer',
        },
      },
    },
  })
  getLinks() {
    return this.supportService.getLinks();
  }
}
