import { IsEnum, IsString, IsDateString, IsOptional, ValidateNested, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender, MaritalStatus } from '@prisma/client';

export class CreatePatientProfileDto {
    @ApiProperty({ example: '123.456.789-00' })
    @IsString()
    @IsNotEmpty()
    cpf: string;

    @ApiProperty({ example: '1990-01-01' })
    @IsDateString()
    @IsNotEmpty()
    birthDate: string;

    @ApiProperty({ enum: Gender, example: Gender.MALE })
    @IsEnum(Gender)
    @IsNotEmpty()
    gender: Gender;

    @ApiProperty({ enum: MaritalStatus, example: MaritalStatus.SINGLE })
    @IsEnum(MaritalStatus)
    @IsNotEmpty()
    maritalStatus: MaritalStatus;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    profession?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    emergencyContact?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    emergencyPhone?: string;

    @ApiProperty({ required: true })
    @IsBoolean()
    @IsNotEmpty()
    termsAccepted: boolean;
}
