import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MemberModule } from './member/member.module';
import { EventModule } from './event/event.module';
import { NoticeModule } from './notice/notice.module';
import { GalleryModule } from './gallery/gallery.module';
import { InquiryModule } from './inquiry/inquiry.module';
import { TermsModule } from './terms/terms.module';
import { PreRegistrationModule } from './pre-registration/pre-registration.module';
import { BusinessInfoModule } from './business-info/business-info.module';
import { FaqModule } from './faq/faq.module';

@Module({
  imports: [
    PrismaModule,
    MemberModule,
    EventModule,
    NoticeModule,
    GalleryModule,
    InquiryModule,
    TermsModule,
    PreRegistrationModule,
    BusinessInfoModule,
    FaqModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

