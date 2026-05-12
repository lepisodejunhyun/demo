import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { ColumnDef, PageInfo } from "./data-table.types";

@Component({
    selector: 'app-data-table',
    templateUrl: './data-table.component.html',
    imports: [CommonModule],
})
export class DataTableComponent {
    columns = input.required<ColumnDef[]>();
    items = input.required<any[]>();
    pageInfo = input<PageInfo | null>(null);
    emptyIcon = input<string>('quiz');
    emptyMessage = input<string>('등록된 데이터가 없습니다.');

    rowClick = output<any>();
    pageChange = output<number>();

    getValue(item: any, field: string): any {
        return item[field];
    }

    get pages(): number[] {
        const info = this.pageInfo();
        if (!info) return [];
        return Array.from({ length: info.totalPages }, (_, i) => i + 1);
    }

    getRowNumber(index: number): number {
        const info = this.pageInfo();
        if (!info) return this.items().length - index;
        return info.totalItems - (info.page - 1) * info.limit - index;
    }

    onRowClick(item: any): void {
        this.rowClick.emit(item);
    }

    onPageChange(page: number): void {
        const info = this.pageInfo();
        if (!info || page < 1 || page > info.totalPages) return;
        this.pageChange.emit(page);
    }


}