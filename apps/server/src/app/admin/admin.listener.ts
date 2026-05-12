import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { AdminEvents } from "./admin.const";
import { Admin } from "@prisma/client";

@Injectable()
export class AdminListener implements OnModuleInit {
  private readonly logger = new Logger(AdminListener.name);

  constructor(private readonly eventEmitter: EventEmitter2) { }

  onModuleInit() {
    this.logger.log('AdminListener가 실행되었습니다.');
  }

  @OnEvent(AdminEvents.ADMIN_LOGGED_IN)
  async handleAdminLoggedInEvent(payload: { admin: Admin }) {
    const { admin } = payload;
    this.logger.log(`관리자 로그인 이벤트 처리 완료: ${admin.email}`);
  }
}
