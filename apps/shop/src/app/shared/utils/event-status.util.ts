import { EventDto } from '@api-client-shop';

export function getEventStatus(event: EventDto): { label: string; class: string } {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (now > end) {
        return { label: '종료', class: 'bg-slate-100 text-slate-500' };
    } else if (now >= start) {
        return { label: '진행중', class: 'bg-emerald-100 text-emerald-700' };
    } else if (event.preRegStartDate && event.preRegEndDate) {
        const preStart = new Date(event.preRegStartDate);
        const preDeadline = new Date(event.preRegEndDate);
        preDeadline.setDate(preDeadline.getDate() + 1);
        if (now >= preStart && now < preDeadline) {
            return { label: '사전 등록중', class: 'bg-violet-100 text-violet-700' };
        }
    }
    return { label: '예정', class: 'bg-blue-100 text-blue-700' };
}

export function isPreRegistrationOpen(event: EventDto): boolean {
    if (!event?.preRegStartDate || !event?.preRegEndDate) return false;

    const now = new Date();
    const preStart = new Date(event.preRegStartDate);
    const preEnd = new Date(event.preRegEndDate);
    preEnd.setDate(preEnd.getDate() + 1);
    return now >= preStart && now < preEnd;
}

export function getDday(endDate: string | Date): string {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return '마감';
    return `D-${diff}`;
}
