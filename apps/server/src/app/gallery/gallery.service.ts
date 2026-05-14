import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OffsetPaginationDTO } from "../../libs/dtos";
import { Gallery } from "@prisma/client";
import { GalleryCreateDTO } from "./dtos/gallery-create.dto";

@Injectable()
export class GalleryService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    /**
     * @name findAll
     * @description 갤러리 페이지네이션 조회 (썸네일 포함)
     * @param {number} page - 페이지 번호 (기본값: 1)
     * @param {number} limit - 페이지당 항목 수 (기본값: 16)
     * @returns {Promise<OffsetPaginationDTO<any>>}
     */
    async findAll(page: number = 1, limit: number = 16): Promise<OffsetPaginationDTO<any>> {
        const skip = (page - 1) * limit;

        const [items, totalItems] = await Promise.all([
            this.prisma.gallery.findMany({
                where: {
                    deletedAt: null,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.gallery.count({
                where: {
                    deletedAt: null,
                },
            }),
        ]);

        const itemsWithThumbnail = await Promise.all(
            items.map(async (gallery) => {
                const firstImage = await this.prisma.attachment.findFirst({
                    where: {
                        entityType: 'gallery',
                        entityId: gallery.id,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
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
     * @returns {Promise<any>}
     */
    async findById(id: string): Promise<any> {
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
            orderBy: {
                sortOrder: 'asc',
            },
        });

        return { ...gallery, images };
    }

    /**
     * @name create
     * @description 갤러리 생성 (이미지 첨부 포함)
     * @param {GalleryCreateDTO} data
     * @returns {Promise<any>}
     */
    async create(data: GalleryCreateDTO): Promise<any> {
        const { title, content, imageUrls } = data;

        const gallery = await this.prisma.gallery.create({
            data: {
                title,
                content: content ?? null,
            },
        });

        await this.prisma.attachment.createMany({
            data: imageUrls.map((url, i) => ({
                url,
                entityType: 'gallery',
                entityId: gallery.id,
                sortOrder: i,
            })),
        });

        return gallery;
    }

    /**
     * @name update
     * @description 갤러리 수정 (기존 이미지 교체)
     * @param {string} id
     * @param {GalleryCreateDTO} data
     * @returns {Promise<any>}
     */
    async update(id: string, data: GalleryCreateDTO): Promise<any> {
        await this.findById(id);

        const { title, content, imageUrls } = data;

        const gallery = await this.prisma.gallery.update({
            where: {
                id,
            },
            data: {
                title,
                content: content ?? null,
            },
        });

        await this.prisma.attachment.deleteMany({
            where: {
                entityType: 'gallery',
                entityId: id,
            },
        });

        await this.prisma.attachment.createMany({
            data: imageUrls.map((url, i) => ({
                url,
                entityType: 'gallery',
                entityId: id,
                sortOrder: i,
            })),
        });

        return gallery;
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