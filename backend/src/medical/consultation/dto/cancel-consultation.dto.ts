import { IsString, MinLength } from 'class-validator';

export class CancelConsultationDto {
    @IsString()
    @MinLength(10, { message: 'Cancellation reason must be at least 10 characters' })
    cancelled_reason: string;
}
