export interface ColumnDef {
    field: string;
    name: string;
    type?: 'text' | 'date' | 'number';
    dateFormat?: string;
    truncate?: boolean;
    width?: string;
}

export interface PageInfo {
    page: number;
    limit: number;
    pageItems: number;
    totalItems: number;
    totalPages: number;

}