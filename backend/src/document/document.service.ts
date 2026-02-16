import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType } from '@prisma/client';

@Injectable()
export class DocumentService {
    constructor(private prisma: PrismaService) { }

    async upload(patientId: string, file: any, type: DocumentType, title: string) {
        // Mock S3 Upload
        // In production, this would upload to S3/Supabase and return the URL
        console.log(`Uploading file ${file.originalname} for patient ${patientId}`);

        // Simulate latency
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockUrl = `https://mock-storage.com/${patientId}/${file.originalname}`;
        const mockHash = 'mock-sha256-hash';

        return this.prisma.clinicalDocument.create({
            data: {
                patient_id: patientId,
                type,
                title,
                file_url: mockUrl,
                file_hash: mockHash,
            },
        });
    }

    async findAll(patientId: string) {
        return this.prisma.clinicalDocument.findMany({
            where: { patient_id: patientId },
            orderBy: { created_at: 'desc' },
        });
    }
}
