import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    async send(patientId: string, channel: string, type: string, content: string) {
        // Mock sending (e.g. via Twilio/SendGrid)
        console.log(`Sending ${channel} to ${patientId}: ${content}`);

        // Log to DB
        return this.prisma.notificationLog.create({
            data: {
                patient_id: patientId,
                channel,
                type,
                status: 'SENT', // Mock success
                content,
                sent_at: new Date(),
            },
        });
    }
}
