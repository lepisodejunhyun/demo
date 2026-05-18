import { Module } from '@nestjs/common';
import { BusinessInfoController } from './business-info.controller';
import { BusinessInfoService } from './business-info.service';

@Module({
  controllers: [BusinessInfoController],
  providers: [BusinessInfoService],
})
export class BusinessInfoModule {}
