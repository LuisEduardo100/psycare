import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePatientDto {
    @ApiProperty({ example: 'Patient Name' })
    @IsNotEmpty()
    @IsString()
    full_name: string;

    @ApiProperty({ example: 'patient@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Display123!' })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;

    // Optional initial profile data can be added later
}
