import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class Icd10Service {
    constructor(private prisma: PrismaService) { }

    async search(query: string) {
        if (!query || query.length < 2) {
            return [];
        }

        const normalizedQuery = query.trim();

        return this.prisma.iCD10Code.findMany({
            where: {
                OR: [
                    { code: { contains: normalizedQuery, mode: 'insensitive' } },
                    { description: { contains: normalizedQuery, mode: 'insensitive' } },
                ],
            },
            take: 20,
            orderBy: {
                code: 'asc',
            },
        });
    }
}
