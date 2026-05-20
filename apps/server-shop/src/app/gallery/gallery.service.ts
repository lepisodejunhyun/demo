import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OffsetPaginationDto, paginate } from '@org/api/pagination';
import { Attachment, Gallery } from '@prisma/client';

@Injectable()
export class GalleryService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name findAll
     * @description 갤러리 전체 조회 (썸네일 포함)
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<OffsetPaginationDto<Gallery & { thumbnailUrl: string | null }>>}
     */
    async findAll(page: number, limit: number): Promise<OffsetPaginationDto<Gallery & { thumbnailUrl: string | null }>> {
        const result = await paginate(this.prisma.gallery, {
            page,
            limit,
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });

        const itemsWithThumbnail = await Promise.all(
            result.items.map(async (gallery) => {
                const firstImage = await this.prisma.attachment.findFirst({
                    where: {
                        entityType: 'gallery',
                        entityId: gallery.id,
                    },
                    orderBy: { sortOrder: 'asc' },
                });
                return {
                    ...gallery,
                    thumbnailUrl: firstImage?.url ?? null,
                };
            })
        );

        return {
            ...result,
            items: itemsWithThumbnail,
        };
    }

    /**
     * @name findById
     * @description 갤러리 상세 조회 (이미지 전체 포함)
     * @param {string} id
     * @returns {Promise<Gallery & { images: Attachment[] }>}
     */
    async findById(id: string): Promise<Gallery & { images: Attachment[] }> {
        const gallery = await this.prisma.gallery.findUnique({
            where: {
                id,
                deletedAt: null,
            },
        });

        if (!gallery) throw new NotFoundException('갤러리 정보를 찾을 수 없습니다.');

        const images = await this.prisma.attachment.findMany({
            where: {
                entityType: 'gallery',
                entityId: id,
            },
            orderBy: { sortOrder: 'asc' },
        });

        return { ...gallery, images };
    }
}
