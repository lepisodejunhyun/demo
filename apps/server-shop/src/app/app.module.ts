import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MemberModule } from './member/member.module';
import { EventModule } from './event/event.module';
import { NoticeModule } from './notice/notice.module';
import { GalleryModule } from './gallery/gallery.module';
import { InquiryModule } from './inquiry/inquiry.module';

@Module({
  imports: [
    PrismaModule,
    MemberModule,
    EventModule,
    NoticeModule,
    GalleryModule,
    InquiryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
