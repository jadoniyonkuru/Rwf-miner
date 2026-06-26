import { Module } from '@nestjs/common';
import { MiningService } from './mining.service';
import { MiningController } from './mining.controller';

@Module({
  controllers: [MiningController],
  providers: [MiningService],
  exports: [MiningService],
})
export class MiningModule {}
