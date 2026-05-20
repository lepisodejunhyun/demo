import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDto } from "../../libs/dtos";
import { Attachment, Gallery } from "@prisma/client";
import { CreateGalleryDto } from "./dtos/create-gallery.dto";

@Injectable()
export class GalleryService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name create
     * @description 갤러리 생성 (이미지 첨부 포함)
     * @param {CreateGalleryDto} data
     * @returns {Promise<any>}
     */
    async create(data: CreateGalleryDto): Promise<any> {
        const { title, content, imageUrls } = data;

        return this.prisma.$transaction(async (tx) => {
            const gallery = await tx.gallery.create({
                data: {
                    title,
                    content: content ?? null,
                },
            });

            await tx.attachment.createMany({
                data: imageUrls.map((url, i) => ({
                    url,
                    entityType: 'gallery',
                    entityId: gallery.id,
                    sortOrder: i,
                })),
            });

            return gallery;
        });
    }

    /**
     * @name findAll
     * @description 갤러리 페이지네이션 조회 (썸네일 포함)
     * @param {number} page - 페이지 번호
     * @param {number} limit - 페이지당 항목 수
     * @returns {Promise<OffsetPaginationDto<Gallery & { thumbnailUrl: string | null }>>}
     */
    async findAll(page: number, limit: number): Promise<OffsetPaginationDto<Gallery & { thumbnailUrl: string | null }>> {
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            this.prisma.gallery.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.gallery.count({
                where: { deletedAt: null },
            }),
        ]);

        const itemsWithThumbnail = await Promise.all(
            items.map(async (gallery) => {
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
            items: itemsWithThumbnail,
            pageInfo: {
                page,
                limit,
                pageItems: items.length,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
            },
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

        if (!gallery) throw new NotFoundException('갤러리를 찾을 수 없습니다.');

        const images = await this.prisma.attachment.findMany({
            where: {
                entityType: 'gallery',
                entityId: id,
            },
            orderBy: { sortOrder: 'asc' },
        });

        return { ...gallery, images };
    }


    /**
     * @name update
     * @description 갤러리 수정 (기존 이미지 교체)
     * @param {string} id
     * @param {CreateGalleryDto} data
     * @returns {Promise<any>}
     */
    async update(id: string, data: CreateGalleryDto): Promise<any> {
        await this.findById(id);

        const { title, content, imageUrls } = data;

        return this.prisma.$transaction(async (tx) => {
            const gallery = await tx.gallery.update({
                where: {
                    id,
                },
                data: {
                    title,
                    content: content ?? null,
                },
            });

            await tx.attachment.deleteMany({
                where: {
                    entityType: 'gallery',
                    entityId: id,
                },
            });

            await tx.attachment.createMany({
                data: imageUrls.map((url, i) => ({
                    url,
                    entityType: 'gallery',
                    entityId: id,
                    sortOrder: i,
                })),
            });

            return gallery;
        });
    }

    /**
     * @name remove
     * @description 갤러리 삭제
     * @param {string} id
     * @returns {Promise<Gallery>}
     */
    async remove(id: string): Promise<Gallery> {
        const gallery = await this.prisma.gallery.update({
            where: {
                id,
            },
            data: {
                deletedAt: new Date(),
            },
        });

        return gallery;
    }
}