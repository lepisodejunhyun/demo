const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.$connect();

    const events = await prisma.event.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
    });

    console.log('행사 ' + events.length + '개 발견\n');

    const posterMap = {
        '2026 밀리언쇼 시즌1': 'https://picsum.photos/seed/poster-millionshow1/800/1200',
        '밀리언 아트페어': 'https://picsum.photos/seed/poster-artfair/800/1200',
        '테크 이노베이션 서밋': 'https://picsum.photos/seed/poster-techsummit/800/1200',
        '푸드 페스티벌 2026': 'https://picsum.photos/seed/poster-foodfest/800/1200',
        '뷰티 엑스포': 'https://picsum.photos/seed/poster-beautyexpo/800/1200',
        '스타트업 데모데이': 'https://picsum.photos/seed/poster-startup/800/1200',
        '키즈 에듀 페스타': 'https://picsum.photos/seed/poster-kidsedu/800/1200',
        '헬스케어 컨퍼런스': 'https://picsum.photos/seed/poster-healthcare/800/1200',
        '반려동물 박람회': 'https://picsum.photos/seed/poster-petshow/800/1200',
        '디자인 위크 서울': 'https://picsum.photos/seed/poster-designweek/800/1200',
        '오토모티브 쇼': 'https://picsum.photos/seed/poster-autoshow/800/1200',
        '게임 페스타': 'https://picsum.photos/seed/poster-gamefesta/800/1200',
        '음악 페스티벌': 'https://picsum.photos/seed/poster-musicfest/800/1200',
        '친환경 에너지 엑스포': 'https://picsum.photos/seed/poster-energyexpo/800/1200',
        '북 페어 서울': 'https://picsum.photos/seed/poster-bookfair/800/1200',
        '패션위크 서울': 'https://picsum.photos/seed/poster-fashionweek/800/1200',
        '2026 밀리언쇼 시즌2': 'https://picsum.photos/seed/poster-millionshow2/800/1200',
    };

    for (const event of events) {
        const url = posterMap[event.title];
        if (!url) {
            console.log('[SKIP] ' + event.title);
            continue;
        }
        await prisma.event.update({
            where: { id: event.id },
            data: { posterImage: url },
        });
        console.log('[OK] ' + event.title);
    }

    console.log('\n포스터 이미지 설정 완료!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
