import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FaqModule } from './faq/faq.module';
import { NoticeModule } from './notice/notice.module';

@Module({
  imports: [PrismaModule, AdminModule, EventEmitterModule.forRoot(), FaqModule, NoticeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
