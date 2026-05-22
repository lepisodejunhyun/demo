import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Api, termsControllerFindAll, TermsDto } from '@api-client-shop';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ContentWrapperComponent } from '../../components/content-wrapper/content-wrapper.component';
import { TabNavComponent, TabItem } from '../../components/tab-nav/tab-nav.component';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-terms',
    imports: [CommonModule, PageHeaderComponent, ContentWrapperComponent, TabNavComponent],
    templateUrl: './terms.page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TermsPage {
    private readonly api = inject(Api);
    private readonly route = inject(ActivatedRoute);
    private readonly toast = inject(ToastrService);
    private readonly queryParams = toSignal(this.route.queryParams);

    termsList = signal<TermsDto[]>([]);
    selectedId = signal<string | null>(null);

    tabItems = computed<TabItem[]>(() =>
        this.termsList().map(t => ({ label: t.title, id: t.id }))
    );

    constructor() {
        effect(() => {
            this.selectedId.set(this.queryParams()?.['tab'] || null);
            if (this.termsList().length > 0 && !this.selectedId()) {
                this.selectedId.set(this.termsList()[0].id);
            }
        });
        this.loadData();
    }

    private async loadData(): Promise<void> {
        try {
            this.termsList.set(await this.api.invoke(termsControllerFindAll, {}));
            if (!this.selectedId() && this.termsList().length > 0) {
                this.selectedId.set(this.termsList()[0].id);
            }
        } catch (error) {
            console.error('약관 목록 조회 실패', error);
            this.toast.error('데이터를 불러오지 못했습니다.');
        }
    }

    selectedTerms = computed(() =>
        this.termsList().find((data) => data.id === this.selectedId())
    );

    selectTab(id: string): void {
        this.selectedId.set(id);
    }
}
