import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MedicationService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.medication.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async search(query: string) {
        return this.prisma.medication.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { active_ingredient: { contains: query, mode: 'insensitive' } },
                ]
            },
            take: 20,
        });
    }
}
