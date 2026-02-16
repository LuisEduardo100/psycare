import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({ enum: Role, default: Role.PATIENT })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    crm?: string; // Doctor only

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    uf?: string; // Doctor only

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    phone?: string;
}
