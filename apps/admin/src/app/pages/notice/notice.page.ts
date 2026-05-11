import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Api, noticeControllerFindAll, NoticeDto } from "@api-client";

@Component({
    selector: 'app-notice',
    templateUrl: './notice.page.html',
    imports: [CommonModule, RouterLink],
})
export default class NoticePage implements OnInit {

    private readonly api = inject(Api);
    private readonly cdr = inject(ChangeDetectorRef);

    notices: NoticeDto[] = [];

    async ngOnInit() {
        try {
            this.notices = await this.api.invoke(noticeControllerFindAll, {});
            this.cdr.markForCheck();
        } catch (error) {
            console.error('공지사항 목록 조회 실패', error);
        }
    }

}