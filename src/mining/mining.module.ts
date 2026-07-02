import { Module } from '@nestjs/common';
import { MiningService } from './mining.service';
import { MiningController } from './mining.controller';
import { MiningCron } from './mining.cron';

@Module({
  controllers: [MiningController],
  providers: [MiningService, MiningCron],
  exports: [MiningService, MiningCron],
})
export class MiningModule {}
