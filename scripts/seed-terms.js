const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.$connect();

    // 약관 데이터
    const termsData = [
        { title: '개인정보 처리방침', isRequired: true, content: '개인정보 처리방침\n\n1. 수집하는 개인정보 항목\n- 이름, 연락처, 이메일\n\n2. 개인정보의 수집 및 이용 목적\n- 서비스 제공 및 운영\n- 행사 안내 및 사전등록 관리\n- 문의 응대\n\n3. 개인정보의 보유 및 이용 기간\n- 회원 탈퇴 시 또는 수집 목적 달성 후 즉시 파기\n- 단, 관계 법령에 의해 보존할 필요가 있는 경우 해당 기간 동안 보존\n\n4. 개인정보의 파기 절차 및 방법\n- 전자적 파일 형태: 복구 불가능한 방법으로 영구 삭제\n- 종이 문서: 분쇄기로 분쇄하거나 소각\n\n5. 개인정보 보호책임자\n- 담당: 관리팀\n- 연락처: support@example.com' },
        { title: '이용약관', isRequired: true, content: '제1조 (목적)\n이 약관은 회사가 제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.\n\n제2조 (정의)\n1. "서비스"란 회사가 제공하는 모든 온라인 서비스를 의미합니다.\n2. "이용자"란 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.\n3. "회원"이란 서비스에 회원등록을 한 자로서, 서비스를 이용할 수 있는 자를 말합니다.\n\n제3조 (약관의 효력 및 변경)\n1. 이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.\n2. 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.\n\n제4조 (서비스의 제공 및 변경)\n1. 회사는 이용자에게 아래와 같은 서비스를 제공합니다.\n   - 행사 정보 제공 서비스\n   - 사전 등록 서비스\n   - 갤러리 서비스\n   - 1:1 문의 서비스\n2. 회사는 서비스의 내용을 변경할 수 있으며, 변경 시 사전에 공지합니다.\n\n제5조 (서비스의 중단)\n1. 회사는 시스템 점검, 장비 교체 등 부득이한 사유가 있는 경우 서비스를 일시적으로 중단할 수 있습니다.\n2. 천재지변 또는 이에 준하는 불가항력으로 인한 서비스 중단에 대해 회사는 책임을 지지 않습니다.' },
        { title: '마케팅 정보 수신 동의', isRequired: false, content: '마케팅 정보 수신 동의 (선택)\n\n회사는 이용자에게 다양한 행사 정보와 혜택을 제공하기 위해 아래와 같이 마케팅 정보를 수집·이용하고자 합니다.\n\n1. 수집 항목: 이메일 주소, 휴대폰 번호, 이름\n2. 이용 목적: 신규 행사 안내, 맞춤형 추천, 프로모션 안내\n3. 수신 방법: 이메일, SMS/MMS, 앱 푸시 알림\n4. 보유 기간: 동의 철회 시 또는 회원 탈퇴 시까지\n5. 동의 거부 시 기본 서비스 이용에는 제한이 없습니다.' },
        { title: '제3자 정보 제공 동의', isRequired: false, content: '개인정보 제3자 제공 동의\n\n1. 제공받는 자: 행사 주최사 및 협력업체\n2. 제공 목적: 사전 등록 확인, 행사 참여 안내, 현장 입장 관리\n3. 제공 항목: 이름, 연락처, 사전 등록 정보\n4. 보유 기간: 해당 행사 종료 후 3개월까지\n5. 동의 거부 시 사전 등록 서비스 이용이 제한될 수 있습니다.' },
    ];

    // 약관 시드
    for (const t of termsData) {
        const exists = await prisma.terms.findFirst({ where: { title: t.title, deletedAt: null } });
        if (!exists) {
            await prisma.terms.create({ data: t });
            console.log('[OK] 약관: ' + t.title + (t.isRequired ? ' (필수)' : ' (선택)'));
        } else {
            console.log('[SKIP] 약관: ' + t.title);
        }
    }

    // Admin 시드
    const adminExists = await prisma.admin.findFirst({ where: { email: 'admin@lepisode.team' } });
    if (!adminExists) {
        const { hashSync } = require('bcryptjs');
        const hash = hashSync('admin123!@', 10);
        await prisma.admin.create({
            data: { email: 'admin@lepisode.team', password: hash, name: '관리자' }
        });
        console.log('[OK] Admin 계정 생성');
    } else {
        console.log('[SKIP] Admin 계정 이미 존재');
    }

    console.log('\n완료!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
