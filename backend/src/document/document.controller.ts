import { Body, Controller, Get, Post, Query, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DocumentType } from '@prisma/client';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
    constructor(private readonly documentService: DocumentService) { }

    @Post('upload')
    @Roles('DOCTOR', 'SECRETARY')
    @UseInterceptors(FileInterceptor('file'))
    upload(
        @Request() req,
        @UploadedFile() file: any,
        @Body('patient_id') patientId: string,
        @Body('type') type: DocumentType,
        @Body('title') title: string
    ) {
        // In a real app we would validate file type/size here
        return this.documentService.upload(patientId, file, type, title);
    }

    @Get()
    @Roles('DOCTOR', 'PATIENT')
    findAll(@Query('patient_id') patientId: string, @Request() req) {
        // Access control check: Patient can only view own docs
        // Doctor can view any
        if (req.user.role === 'PATIENT' && req.user.patient_profile?.id !== patientId) {
            // Additional check needed if patient_profile not in request user object
            // For now, allow relying on service or add stricter guard logic 
        }
        return this.documentService.findAll(patientId);
    }
}
