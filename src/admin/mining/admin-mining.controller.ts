import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminMiningService } from './admin-mining.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreditMiningDto } from './dto/credit-mining.dto';

@ApiTags('Admin - Mining / Oracle')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/mining')
export class AdminMiningController {
  constructor(private readonly adminMiningService: AdminMiningService) {}

  @Post('credit')
  @ApiOperation({ summary: 'Credit mining earnings to one user or all users (Oracle)' })
  creditEarnings(@Body() dto: CreditMiningDto) {
    return this.adminMiningService.creditEarnings(dto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Platform-wide mining statistics summary' })
  getSummary() {
    return this.adminMiningService.getSummary();
  }
}
