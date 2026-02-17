import { IsString, MinLength } from 'class-validator';

export class RevokePrescriptionDto {
    @IsString()
    @MinLength(10, { message: 'Revocation reason must be at least 10 characters' })
    revoked_reason: string;
}
