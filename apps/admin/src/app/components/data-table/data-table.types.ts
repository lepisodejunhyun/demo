import { StatusBadgeVariant } from "../status-badge/status-badge.component";

export interface BadgeMapEntry {
    label: string;
    variant: StatusBadgeVariant;
}

export interface ColumnDef {
    field: string;
    name?: string;
    type?: 'text' | 'date' | 'number' | 'boolean' | 'badge';
    booleanLabels?: { true: string; false: string };
    badgeMap?: Record<string, BadgeMapEntry>;
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