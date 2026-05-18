/**
 * 한국 전화번호 자동 포맷팅
 *
 * - 02로 시작 (10자리): 02-1234-5678  (2-4-4)
 * - 3자리 지역번호 (10자리): 031-123-4567  (3-3-4)
 * - 휴대폰 (11자리): 010-1234-5678  (3-4-4)
 * - 대표번호 (8자리): 1588-1234  (4-4)
 * - 그 외: 3-4-4 기본 적용
 */
export function formatPhoneNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);

    // 8자리 대표번호 (15xx, 16xx, 18xx 등)
    if (digits.length === 8 && /^1[5-9]/.test(digits)) {
        return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }

    // 02 서울 지역번호
    if (digits.startsWith('02')) {
        if (digits.length > 6) {
            // 02-1234-5678 (2-4-4)
            return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
        } else if (digits.length > 2) {
            return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        }
        return digits;
    }

    // 일반 3자리 지역번호 / 휴대폰
    if (digits.length === 10) {
        // 3-3-4 (031-123-4567)
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    if (digits.length === 11) {
        // 3-4-4 (010-1234-5678)
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }

    // 입력 중 (아직 완성 안 된 번호)
    if (digits.length > 7) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 3) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }

    return digits;
}
