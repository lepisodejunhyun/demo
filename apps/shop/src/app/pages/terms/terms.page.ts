import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Api, termsControllerFindAll, TermsDto } from '@api-client-shop';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
    selector: 'app-terms',
    imports: [CommonModule, PageHeaderComponent],
    templateUrl: './terms.page.html',
})
export default class TermsPage implements OnInit {
    private readonly api = inject(Api);
    private readonly route = inject(ActivatedRoute);
    private readonly cdr = inject(ChangeDetectorRef);

    termsList: TermsDto[] = [];
    selectedId: string | null = null;

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.selectedId = params['tab'] || null;
            if (this.termsList.length > 0 && !this.selectedId) {
                this.selectedId = this.termsList[0].id;
            }
            this.cdr.markForCheck();
        });
        this.loadData();
    }

    private async loadData(): Promise<void> {
        try {
            this.termsList = await this.api.invoke(termsControllerFindAll, {});
            if (!this.selectedId && this.termsList.length > 0) {
                this.selectedId = this.termsList[0].id;
            }
            this.cdr.markForCheck();
        } catch (error) {
            console.error('약관 목록 조회 실패', error);
        }
    }

    get selectedTerms(): TermsDto | undefined {
        return this.termsList.find((t) => t.id === this.selectedId);
    }

    selectTab(id: string): void {
        this.selectedId = id;
    }
}
