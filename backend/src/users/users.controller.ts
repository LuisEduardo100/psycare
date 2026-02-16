import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException, Patch, Param, Query, Res, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    async getProfile(@Request() req) {
        const user = await this.usersService.findById(req.user.userId);
        if (!user) throw new UnauthorizedException();

        // Exclude profile_picture from main payload to optimize
        const { profile_picture, password_hash, ...userData } = user;

        const profile = await this.usersService.findPatientProfile(req.user.userId);
        return { ...userData, hasProfile: !!profile, hasAvatar: !!profile_picture };
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me/doctor')
    async getLinkedDoctor(@Request() req) {
        return this.usersService.getLinkedDoctor(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Patch('me')
    async updateProfile(@Request() req, @Body() body: any) {
        // Simplified for now: expecting JSON body with base64 image or just text fields
        // In a real implementation with multipart/form-data, we'd use FileInterceptor here
        return this.usersService.updateProfile(req.user.userId, {
            fullName: body.full_name,
            phone: body.phone,
            profilePicture: body.profile_picture, // Base64 string expected from frontend
            street: body.street,
            number: body.number,
            complement: body.complement,
            neighborhood: body.neighborhood,
            city: body.city,
            state: body.state,
            zipCode: body.zip_code // Frontend sends snake_case probably? let's standardise on what frontend sends.
            // If frontend uses the form schema, it might send what?
        });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me/timeline')
    async getMyTimeline(@Request() req) {
        return this.usersService.getDashboardTimeline(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('profile')
    async createProfile(@Request() req, @Body() createProfileDto: CreatePatientProfileDto) {
        return this.usersService.createPatientProfile(req.user.userId, createProfileDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles('DOCTOR', 'SECRETARY')
    @Get('patients')
    async findAllPatients(@Request() req) {
        return this.usersService.findAllPatients(req.user.userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles('DOCTOR')
    @Get('patients/:id')
    async findPatientDetail(@Request() req, @Param('id') id: string) {
        return this.usersService.findPatientDetail(req.user.userId, id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles('DOCTOR')
    @Get('patients/:id/timeline')
    async getPatientTimeline(
        @Request() req,
        @Param('id') id: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.usersService.getPatientTimeline(
            req.user.userId,
            id,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles('DOCTOR')
    @Post('patients')
    async createPatient(@Request() req, @Body() createPatientDto: any) {
        return this.usersService.createPatient(req.user.userId, createPatientDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles('DOCTOR')
    @Post('patients/invite')
    async invitePatient(@Request() req, @Body() inviteDto: { email: string; fullName: string }) {
        return this.usersService.invitePatient(req.user.userId, inviteDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles('DOCTOR')
    @Get('search')
    async searchPatients(@Query('q') query: string) {
        return this.usersService.searchPatients(query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles('DOCTOR')
    @Post('patients/link')
    async linkPatient(@Request() req, @Body() body: { patientId: string }) {
        return this.usersService.linkPatient(req.user.userId, body.patientId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Patch('password')
    async updatePassword(@Request() req, @Body() updatePasswordDto: any) {
        return this.usersService.updatePassword(req.user.userId, updatePasswordDto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('me/avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/avatars',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                cb(null, `${(req.user as any).userId}-${uniqueSuffix}${ext}`);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }))
    async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        await this.usersService.updateProfilePicturePath(req.user.userId, file.filename);
        return { message: 'Avatar uploaded successfully', filename: file.filename };
    }

    @Get(':id/avatar')
    async getAvatar(@Param('id') id: string, @Res() res) {
        const avatar = await this.usersService.getProfilePicture(id);

        if (!avatar) {
            return res.status(404).send('Avatar not found');
        }

        // Handle File Path (New)
        if (avatar.filePath) {
            // Check if file exists? express sendFile handles it, but let's be safe
            return res.sendFile(avatar.filePath, { root: './uploads/avatars' });
        }

        // Handle Legacy Base64/Buffer
        if (avatar.buffer) {
            res.set('Content-Type', avatar.mimeType);
            return res.send(avatar.buffer);
        }

        return res.status(404).send('Avatar not found');
    }
}

