const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { hashSync } = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.$connect();
    console.log('DB 연결 성공\n');

    // ===== 1. Admin =====
    const adminExists = await prisma.admin.findFirst({ where: { email: 'admin@lepisode.team' } });
    if (!adminExists) {
        await prisma.admin.create({ data: { email: 'admin@lepisode.team', password: hashSync('admin123!@', 10), name: '관리자' } });
        console.log('[OK] Admin 계정 생성');
    } else { console.log('[SKIP] Admin'); }

    // ===== 2. Terms (4개) =====
    const termsData = [
        { title: '개인정보 처리방침', isRequired: true, content: '개인정보 처리방침\n\n1. 수집하는 개인정보 항목\n- 이름, 연락처, 이메일\n\n2. 개인정보의 수집 및 이용 목적\n- 서비스 제공 및 운영\n- 행사 안내 및 사전등록 관리\n\n3. 보유 및 이용 기간\n- 회원 탈퇴 시 또는 수집 목적 달성 후 즉시 파기\n\n4. 파기 절차\n- 전자적 파일: 복구 불가능한 방법으로 영구 삭제\n- 종이 문서: 분쇄기로 분쇄 또는 소각' },
        { title: '이용약관', isRequired: true, content: '제1조 (목적)\n이 약관은 회사가 제공하는 서비스 이용에 관하여 권리, 의무 및 책임사항을 규정합니다.\n\n제2조 (정의)\n1. "서비스"란 회사가 제공하는 모든 온라인 서비스입니다.\n2. "이용자"란 이 약관에 따라 서비스를 이용하는 회원 및 비회원입니다.\n\n제3조 (약관의 효력 및 변경)\n회사는 관련 법령 범위에서 약관을 개정할 수 있으며, 변경 시 7일 전 공지합니다.\n\n제4조 (서비스 제공)\n행사 정보, 사전 등록, 갤러리, 1:1 문의 서비스를 제공합니다.' },
        { title: '마케팅 정보 수신 동의', isRequired: false, content: '마케팅 정보 수신 동의 (선택)\n\n1. 수집 항목: 이메일, 휴대폰 번호, 이름\n2. 이용 목적: 신규 행사 안내, 맞춤 추천, 프로모션 안내\n3. 수신 방법: 이메일, SMS, 앱 푸시\n4. 보유 기간: 동의 철회 또는 회원 탈퇴 시까지\n5. 동의하지 않아도 기본 서비스 이용에 제한 없습니다.' },
        { title: '제3자 정보 제공 동의', isRequired: false, content: '개인정보 제3자 제공 동의\n\n1. 제공받는 자: 행사 주최사 및 협력업체\n2. 제공 목적: 사전 등록 확인, 행사 참여 안내\n3. 제공 항목: 이름, 연락처, 사전 등록 정보\n4. 보유 기간: 행사 종료 후 3개월\n5. 동의 거부 시 사전 등록이 제한될 수 있습니다.' },
    ];
    for (const t of termsData) {
        const exists = await prisma.terms.findFirst({ where: { title: t.title, deletedAt: null } });
        if (!exists) { await prisma.terms.create({ data: t }); console.log('[OK] 약관: ' + t.title); }
        else { console.log('[SKIP] 약관: ' + t.title); }
    }

    // ===== 3. Notice (15개) =====
    const notices = [
        { title: '2026 밀리언쇼 시즌1 개막 안내', content: '안녕하세요.\n\n2026 밀리언쇼 시즌1이 6월 1일부터 개막합니다.\n많은 관심과 참여 부탁드립니다.\n\n감사합니다.' },
        { title: '사전등록 안내', content: '사전등록을 통해 미리 참여를 예약하실 수 있습니다.\n\n사전등록 기간 내에 등록하시면 우선 입장 혜택이 제공됩니다.' },
        { title: '주차 안내', content: '행사장 주변 주차 공간이 제한적이오니 대중교통 이용을 권장합니다.\n\n주차장 위치: 지하 1~2층\n주차 요금: 1시간 무료, 이후 30분당 1,000원' },
        { title: '행사장 이용 안내', content: '행사장 내에서는 음식물 반입이 제한됩니다.\n촬영은 개인 소장용으로만 가능하며, 상업적 이용은 금지됩니다.' },
        { title: '온라인 스트리밍 안내', content: '현장에 방문하기 어려운 분들을 위해 온라인 스트리밍을 제공합니다.\n\n스트리밍 링크는 행사 당일 공지사항을 통해 안내됩니다.' },
        { title: '할인 이벤트 안내', content: '사전등록 고객 대상 10% 할인 이벤트를 진행합니다.\n\n기간: 2026.05.15 ~ 2026.05.31\n대상: 사전등록 완료 고객' },
        { title: '행사 일정 변경 안내', content: '일부 프로그램의 시간이 변경되었습니다.\n\n변경 전: 14:00 ~ 15:00\n변경 후: 15:00 ~ 16:00\n\n참고 부탁드립니다.' },
        { title: '개인정보 처리방침 개정 안내', content: '2026년 5월 20일부로 개인정보 처리방침이 개정됩니다.\n\n주요 변경사항:\n- 수집 항목 변경\n- 보유 기간 조정' },
        { title: '시스템 점검 안내', content: '아래 일정으로 시스템 점검이 진행됩니다.\n\n일시: 2026.05.25(일) 02:00 ~ 06:00\n영향: 홈페이지 접속 불가\n\n이용에 불편을 드려 죄송합니다.' },
        { title: '고객센터 운영 안내', content: '고객센터 운영 시간을 안내드립니다.\n\n평일: 09:00 ~ 18:00\n주말/공휴일: 휴무\n전화: 02-1234-5678\n이메일: support@example.com' },
        { title: '우천 시 행사 안내', content: '우천 시에도 행사는 정상 진행됩니다.\n실내 행사장으로 전환되며, 우산 보관소를 운영합니다.' },
        { title: '포토존 운영 안내', content: '행사장 내 3개의 포토존이 운영됩니다.\n\n위치: A홀 입구, B홀 중앙, 야외 정원\n운영 시간: 행사 시간과 동일' },
        { title: '참가업체 모집 안내', content: '2026 밀리언쇼 시즌2 참가업체를 모집합니다.\n\n모집 기간: 2026.06.01 ~ 2026.07.31\n문의: partner@example.com' },
        { title: '교통 안내', content: '행사장까지의 교통편을 안내드립니다.\n\n지하철: 2호선 삼성역 5번 출구 도보 10분\n버스: 143, 301, 402번\n셔틀버스: 삼성역 ↔ 행사장 (15분 간격)' },
        { title: '자원봉사자 모집', content: '행사 운영을 도와주실 자원봉사자를 모집합니다.\n\n기간: 행사 기간 중\n혜택: 봉사 시간 인정, 기념품 제공\n신청: volunteer@example.com' },
    ];
    for (const n of notices) {
        await prisma.notice.create({ data: n });
    }
    console.log('[OK] 공지사항 ' + notices.length + '개 생성');

    // ===== 4. FAQ (15개) =====
    const faqs = [
        { question: '행사 일정은 어떻게 되나요?', answer: '각 행사의 상세 일정은 행사 상세 페이지에서 확인하실 수 있습니다.' },
        { question: '사전등록은 어떻게 하나요?', answer: '행사 상세 페이지에서 사전등록 기간 내에 신청하실 수 있습니다. 이름과 연락처를 입력하시면 됩니다.' },
        { question: '사전등록 취소가 가능한가요?', answer: '사전등록 취소는 행사 시작 3일 전까지 가능합니다. 고객센터로 문의해 주세요.' },
        { question: '주차는 가능한가요?', answer: '행사장 지하 주차장을 이용하실 수 있습니다. 1시간 무료이며, 이후 30분당 1,000원입니다.' },
        { question: '반려동물 입장이 가능한가요?', answer: '안전상의 이유로 반려동물 동반 입장은 제한됩니다. 양해 부탁드립니다.' },
        { question: '유아 동반 입장이 가능한가요?', answer: '네, 유아 동반 입장 가능합니다. 유모차 보관소도 운영됩니다.' },
        { question: '행사장 내 촬영이 가능한가요?', answer: '개인 소장용 촬영은 가능하지만, 상업적 이용을 위한 촬영은 사전 허가가 필요합니다.' },
        { question: '분실물 문의는 어디로 하나요?', answer: '행사장 1층 안내데스크 또는 고객센터(02-1234-5678)로 문의해 주세요.' },
        { question: '환불 규정이 어떻게 되나요?', answer: '행사 7일 전: 전액 환불\n행사 3일 전: 50% 환불\n행사 당일: 환불 불가' },
        { question: '단체 참가 할인이 있나요?', answer: '10인 이상 단체 참가 시 15% 할인이 적용됩니다. 단체 신청은 고객센터로 문의해 주세요.' },
        { question: '행사장 Wi-Fi를 이용할 수 있나요?', answer: '네, 무료 Wi-Fi를 제공합니다. 네트워크명: MillionShow-Guest' },
        { question: '식음료 구매가 가능한가요?', answer: '행사장 내 푸드코트와 카페가 운영됩니다. 외부 음식물 반입은 제한됩니다.' },
        { question: '행사 관련 문의는 어디로 하나요?', answer: '고객센터 전화(02-1234-5678) 또는 홈페이지 1:1 문의를 이용해 주세요.' },
        { question: '온라인 참가가 가능한가요?', answer: '일부 프로그램은 온라인 스트리밍으로 참가 가능합니다. 상세 내용은 각 행사 페이지를 확인해 주세요.' },
        { question: '행사 인증서를 발급받을 수 있나요?', answer: '행사 참가 후 마이페이지에서 참가 인증서를 다운로드하실 수 있습니다.' },
    ];
    for (const f of faqs) {
        await prisma.faq.create({ data: f });
    }
    console.log('[OK] FAQ ' + faqs.length + '개 생성');

    // ===== 5. Event (17개) =====
    const events = [];
    const eventTemplates = [
        { title: '2026 밀리언쇼 시즌1', content: '최대 규모의 종합 전시회가 시작됩니다.\n\n다양한 분야의 최신 트렌드를 한 자리에서 만나보세요.', location: '코엑스 A홀', contactNumber: '02-1234-5678' },
        { title: '밀리언 아트페어', content: '국내외 아티스트들의 작품을 만나볼 수 있는 아트페어입니다.\n\n회화, 조각, 미디어아트 등 다양한 장르를 전시합니다.', location: '코엑스 B홀', contactNumber: '02-1234-5679' },
        { title: '테크 이노베이션 서밋', content: 'AI, 블록체인, IoT 등 최신 기술 트렌드를 공유하는 서밋입니다.\n\n국내외 전문가 강연과 네트워킹 기회를 제공합니다.', location: 'SETEC 1전시장', contactNumber: '02-2345-6789' },
        { title: '푸드 페스티벌 2026', content: '전국 맛집과 셰프들이 모이는 미식 축제입니다.\n\n요리 시연, 시식 이벤트, 쿠킹 클래스가 준비되어 있습니다.', location: '잠실 올림픽공원', contactNumber: '02-3456-7890' },
        { title: '뷰티 엑스포', content: '최신 뷰티 트렌드와 제품을 체험할 수 있는 뷰티 박람회입니다.\n\n메이크업 시연, 무료 체험, 할인 판매를 진행합니다.', location: '코엑스 C홀', contactNumber: '02-4567-8901' },
        { title: '스타트업 데모데이', content: '유망 스타트업의 제품과 서비스를 소개하는 데모데이입니다.\n\n투자자 매칭 및 네트워킹 세션이 포함됩니다.', location: '디캠프', contactNumber: '02-5678-9012' },
        { title: '키즈 에듀 페스타', content: '어린이 교육 관련 콘텐츠와 프로그램을 체험하는 행사입니다.\n\n코딩, 과학 실험, 창작 활동 등 다양한 프로그램이 준비되어 있습니다.', location: '킨텍스 제1전시장', contactNumber: '031-1234-5678' },
        { title: '헬스케어 컨퍼런스', content: '디지털 헬스케어와 웰니스 트렌드를 다루는 컨퍼런스입니다.\n\n의료 전문가와 기업 관계자를 위한 세미나가 진행됩니다.', location: '서울드래곤시티', contactNumber: '02-6789-0123' },
        { title: '반려동물 박람회', content: '반려동물과 함께 즐길 수 있는 종합 박람회입니다.\n\n펫 용품, 건강 상담, 입양 행사 등이 진행됩니다.', location: '코엑스 D홀', contactNumber: '02-7890-1234' },
        { title: '디자인 위크 서울', content: '국내외 디자이너의 작품과 프로젝트를 전시하는 행사입니다.\n\n산업 디자인, UX/UI, 그래픽 디자인 분야를 다룹니다.', location: 'DDP 동대문디자인플라자', contactNumber: '02-8901-2345' },
        { title: '오토모티브 쇼', content: '최신 자동차와 모빌리티 기술을 만나볼 수 있는 자동차 쇼입니다.\n\n전기차, 자율주행, 친환경 기술이 전시됩니다.', location: '킨텍스 제2전시장', contactNumber: '031-2345-6789' },
        { title: '게임 페스타', content: '최신 게임을 체험하고 e스포츠 대회를 관람할 수 있습니다.\n\nPC, 콘솔, 모바일 게임 시연 및 굿즈 판매가 진행됩니다.', location: '부산 벡스코', contactNumber: '051-1234-5678' },
        { title: '음악 페스티벌', content: '다양한 장르의 아티스트가 출연하는 야외 음악 축제입니다.\n\n록, 팝, 일렉트로닉, 힙합 등 다양한 무대가 준비됩니다.', location: '난지한강공원', contactNumber: '02-9012-3456' },
        { title: '친환경 에너지 엑스포', content: '태양광, 풍력, 수소 에너지 등 친환경 에너지 기술 전시회입니다.\n\n정부 정책 설명회와 기업 상담회가 함께 진행됩니다.', location: 'SETEC 2전시장', contactNumber: '02-0123-4567' },
        { title: '북 페어 서울', content: '출판사와 독립서점이 참여하는 도서 박람회입니다.\n\n작가 사인회, 북토크, 독서 프로그램이 운영됩니다.', location: '코엑스 그랜드볼룸', contactNumber: '02-1111-2222' },
        { title: '패션위크 서울', content: '국내 디자이너 브랜드의 신상 컬렉션을 선보이는 패션위크입니다.\n\n런웨이 쇼, 팝업스토어, 스타일링 클래스가 진행됩니다.', location: 'DDP 동대문디자인플라자', contactNumber: '02-3333-4444' },
        { title: '2026 밀리언쇼 시즌2', content: '시즌1의 성공에 이어 더 큰 규모로 돌아온 밀리언쇼 시즌2입니다.\n\n새로운 참가업체와 프로그램이 추가됩니다.', location: '코엑스 전관', contactNumber: '02-1234-5678' },
    ];

    // 다양한 날짜 패턴
    const now = new Date();
    for (let i = 0; i < eventTemplates.length; i++) {
        const t = eventTemplates[i];
        let startDate, endDate, preRegStartDate, preRegEndDate;

        if (i < 3) { // 종료된 행사
            startDate = new Date(now); startDate.setDate(now.getDate() - 30 - i * 5);
            endDate = new Date(now); endDate.setDate(now.getDate() - 10 - i * 3);
        } else if (i < 6) { // 진행중 행사
            startDate = new Date(now); startDate.setDate(now.getDate() - 5 + i);
            endDate = new Date(now); endDate.setDate(now.getDate() + 10 + i * 2);
        } else if (i < 10) { // 사전등록중 행사
            startDate = new Date(now); startDate.setDate(now.getDate() + 20 + i * 3);
            endDate = new Date(now); endDate.setDate(now.getDate() + 30 + i * 3);
            preRegStartDate = new Date(now); preRegStartDate.setDate(now.getDate() - 5);
            preRegEndDate = new Date(now); preRegEndDate.setDate(now.getDate() + 10 + i);
        } else { // 예정 행사
            startDate = new Date(now); startDate.setDate(now.getDate() + 40 + i * 5);
            endDate = new Date(now); endDate.setDate(now.getDate() + 50 + i * 5);
            preRegStartDate = new Date(now); preRegStartDate.setDate(now.getDate() + 20 + i * 3);
            preRegEndDate = new Date(now); preRegEndDate.setDate(now.getDate() + 35 + i * 3);
        }

        const event = await prisma.event.create({
            data: {
                ...t,
                startDate, endDate,
                operatingStartTime: '10:00', operatingEndTime: '18:00',
                preRegStartDate: preRegStartDate || null,
                preRegEndDate: preRegEndDate || null,
            },
        });
        events.push(event);
    }
    console.log('[OK] 행사 ' + events.length + '개 생성');

    // ===== 6. Gallery (20개) =====
    const galleryTitles = [
        '2026 밀리언쇼 시즌1 현장', '아트페어 전시 전경', '테크 서밋 키노트',
        '푸드 페스티벌 현장', '뷰티 엑스포 체험존', '스타트업 데모데이 발표',
        '키즈 에듀 체험 현장', '반려동물 박람회', '디자인 위크 전시',
        '오토모티브 쇼 전시차량', '게임 페스타 e스포츠', '음악 페스티벌 무대',
        '에너지 엑스포 부스', '북 페어 작가 사인회', '패션위크 런웨이',
        '개막식 세레머니', 'VIP 라운지', '네트워킹 파티',
        '폐막식 현장', '자원봉사자 단체사진',
    ];
    for (const title of galleryTitles) {
        await prisma.gallery.create({ data: { title, content: title + ' 사진입니다.' } });
    }
    console.log('[OK] 갤러리 ' + galleryTitles.length + '개 생성');

    // ===== 7. Member (3명) =====
    const members = [];
    const memberData = [
        { email: 'user1@test.com', name: '김철수' },
        { email: 'user2@test.com', name: '박영희' },
        { email: 'user3@test.com', name: '이준호' },
    ];
    for (const m of memberData) {
        const member = await prisma.member.create({ data: m });
        members.push(member);
    }
    console.log('[OK] 회원 ' + members.length + '명 생성');

    // ===== 8. Inquiry (3개) =====
    const inquiryData = [
        { memberId: members[0].id, title: '사전등록 확인 문의', content: '사전등록이 정상적으로 완료되었는지 확인 부탁드립니다.', status: 'COMPLETED', answer: '안녕하세요. 사전등록이 정상 완료된 것으로 확인됩니다. 감사합니다.' },
        { memberId: members[1].id, title: '주차 관련 문의', content: '행사 당일 주차가 가능한가요? 주차 요금도 알려주세요.', status: 'COMPLETED', answer: '지하 주차장 이용 가능합니다. 1시간 무료이며 이후 30분당 1,000원입니다.' },
        { memberId: members[2].id, title: '단체 할인 문의', content: '20명 단체로 참가하려고 합니다. 단체 할인이 가능한가요?', status: 'PENDING' },
    ];
    for (const inq of inquiryData) {
        await prisma.inquiry.create({ data: inq });
    }
    console.log('[OK] 문의 ' + inquiryData.length + '개 생성');

    // ===== 9. PreRegistration (사전등록 가능 행사에 1개) =====
    const preRegEvent = events[6]; // 사전등록중 행사
    if (preRegEvent) {
        await prisma.preRegistration.create({
            data: { eventId: preRegEvent.id, memberId: members[0].id, applicantName: '김철수', contactNumber: '010-1234-5678' },
        });
        console.log('[OK] 사전등록 1개 생성');
    }

    // ===== 10. BusinessInfo =====
    await prisma.businessInfo.create({
        data: {
            name: '(주)밀리언쇼',
            representativeName: '홍길동',
            registrationNumber: '123-45-67890',
            address: '서울특별시 강남구 삼성로 123 밀리언타워 10층',
            contactNumber: '02-1234-5678',
            email: 'info@millionshow.co.kr',
        },
    });
    console.log('[OK] 사업자 정보 생성');

    console.log('\n===== 전체 시드 완료! =====');
}

main().catch(console.error).finally(() => prisma.$disconnect());
