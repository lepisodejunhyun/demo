export const INQUIRY_STATUS_LABELS: Record<string, string> = {
    'PENDING': '답변 대기',
    'COMPLETED': '답변 완료',
};

export function getInquiryStatusStyle(status: string): string {
    return status === 'COMPLETED'
        ? 'bg-primary/10 text-primary'
        : 'bg-secondary/10 text-secondary';
}
