import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { CardGridConfig } from "./card-grid.types";
import { PageInfo } from "../data-table/data-table.types";

@Component({
    selector: 'app-card-grid',
    templateUrl: './card-grid.component.html',
    imports: [CommonModule],
})
export class CardGridComponent {
    items = input.required<any[]>();
    config = input.required<CardGridConfig>();
    pageInfo = input<PageInfo | null>(null);
    emptyIcon = input<string>('photo_library');
    emptyMessage = input<string>('등록된 항목이 없습니다.');
    columns = input<number>(4);

    rowClick = output<any>();
    pageChange = output<number>();

    get pages(): number[] {
        const info = this.pageInfo();
        if (!info) return [];
        return Array.from({ length: info.totalPages }, (_, i) => i + 1);
    }

    getValue(item: any, field: string): any {
        return field.split('.').reduce((obj, key) => obj?.[key], item);
    }

    onCardClick(item: any): void {
        this.rowClick.emit(item);
    }

    onPageChange(page: number): void {
        const info = this.pageInfo();
        if (!info || page < 1 || page > info.totalPages) return;
        this.pageChange.emit(page);
    }
}
