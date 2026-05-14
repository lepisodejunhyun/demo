import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FaqModule } from './faq/faq.module';
import { NoticeModule } from './notice/notice.module';
import { EventModule } from './event/event.module';
import { GalleryModule } from './gallery/gallery.module';
import { InquiryModule } from './inquiry/inquiry.module';
import { BusinessInfoModule } from './business-info/business-info.module';
import { PreRegistrationModule } from './pre-registration/pre-registration.module';
import { TermsModule } from './terms/terms.module';

@Module({
  imports: [PrismaModule, AdminModule, EventEmitterModule.forRoot(), FaqModule, NoticeModule, EventModule, GalleryModule, InquiryModule, BusinessInfoModule, PreRegistrationModule, TermsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
