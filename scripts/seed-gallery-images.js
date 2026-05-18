const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.$connect();

    const galleries = await prisma.gallery.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
    });

    console.log('갤러리 ' + galleries.length + '개 발견\n');

    // 갤러리 제목에 맞는 이미지 URL (picsum.photos 사용)
    const imageMap = {
        '2026 밀리언쇼 시즌1 현장': [
            'https://picsum.photos/seed/expo1/800/600',
            'https://picsum.photos/seed/expo2/800/600',
            'https://picsum.photos/seed/expo3/800/600',
        ],
        '아트페어 전시 전경': [
            'https://picsum.photos/seed/art1/800/600',
            'https://picsum.photos/seed/art2/800/600',
        ],
        '테크 서밋 키노트': [
            'https://picsum.photos/seed/tech1/800/600',
            'https://picsum.photos/seed/tech2/800/600',
            'https://picsum.photos/seed/tech3/800/600',
        ],
        '푸드 페스티벌 현장': [
            'https://picsum.photos/seed/food1/800/600',
            'https://picsum.photos/seed/food2/800/600',
        ],
        '뷰티 엑스포 체험존': [
            'https://picsum.photos/seed/beauty1/800/600',
            'https://picsum.photos/seed/beauty2/800/600',
        ],
        '스타트업 데모데이 발표': [
            'https://picsum.photos/seed/startup1/800/600',
            'https://picsum.photos/seed/startup2/800/600',
        ],
        '키즈 에듀 체험 현장': [
            'https://picsum.photos/seed/kids1/800/600',
            'https://picsum.photos/seed/kids2/800/600',
            'https://picsum.photos/seed/kids3/800/600',
        ],
        '반려동물 박람회': [
            'https://picsum.photos/seed/pet1/800/600',
            'https://picsum.photos/seed/pet2/800/600',
        ],
        '디자인 위크 전시': [
            'https://picsum.photos/seed/design1/800/600',
            'https://picsum.photos/seed/design2/800/600',
        ],
        '오토모티브 쇼 전시차량': [
            'https://picsum.photos/seed/car1/800/600',
            'https://picsum.photos/seed/car2/800/600',
            'https://picsum.photos/seed/car3/800/600',
        ],
        '게임 페스타 e스포츠': [
            'https://picsum.photos/seed/game1/800/600',
            'https://picsum.photos/seed/game2/800/600',
        ],
        '음악 페스티벌 무대': [
            'https://picsum.photos/seed/music1/800/600',
            'https://picsum.photos/seed/music2/800/600',
            'https://picsum.photos/seed/music3/800/600',
        ],
        '에너지 엑스포 부스': [
            'https://picsum.photos/seed/energy1/800/600',
            'https://picsum.photos/seed/energy2/800/600',
        ],
        '북 페어 작가 사인회': [
            'https://picsum.photos/seed/book1/800/600',
            'https://picsum.photos/seed/book2/800/600',
        ],
        '패션위크 런웨이': [
            'https://picsum.photos/seed/fashion1/800/600',
            'https://picsum.photos/seed/fashion2/800/600',
            'https://picsum.photos/seed/fashion3/800/600',
        ],
        '개막식 세레머니': [
            'https://picsum.photos/seed/opening1/800/600',
            'https://picsum.photos/seed/opening2/800/600',
        ],
        'VIP 라운지': [
            'https://picsum.photos/seed/vip1/800/600',
            'https://picsum.photos/seed/vip2/800/600',
        ],
        '네트워킹 파티': [
            'https://picsum.photos/seed/party1/800/600',
            'https://picsum.photos/seed/party2/800/600',
        ],
        '폐막식 현장': [
            'https://picsum.photos/seed/closing1/800/600',
            'https://picsum.photos/seed/closing2/800/600',
        ],
        '자원봉사자 단체사진': [
            'https://picsum.photos/seed/volunteer1/800/600',
            'https://picsum.photos/seed/volunteer2/800/600',
        ],
    };

    let totalAttachments = 0;

    for (const gallery of galleries) {
        const urls = imageMap[gallery.title];
        if (!urls) {
            console.log('[SKIP] ' + gallery.title + ' — 매칭 이미지 없음');
            continue;
        }

        for (let i = 0; i < urls.length; i++) {
            await prisma.attachment.create({
                data: {
                    url: urls[i],
                    fileName: gallery.title + '_' + (i + 1) + '.jpg',
                    sortOrder: i,
                    entityType: 'gallery',
                    entityId: gallery.id,
                },
            });
            totalAttachments++;
        }
        console.log('[OK] ' + gallery.title + ' — ' + urls.length + '장');
    }

    console.log('\n총 ' + totalAttachments + '개 이미지 생성 완료');
}

main().catch(console.error).finally(() => prisma.$disconnect());
