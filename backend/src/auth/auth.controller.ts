import { Controller, Request, Post, UseGuards, Get, Body, UnauthorizedException, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService
    ) { }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    @ApiBody({ schema: { example: { email: 'user@example.com', password: 'password' } } })
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Post('2fa/authenticate')
    @ApiBearerAuth()
    @ApiBody({ schema: { example: { token: '123456' } } })
    async authenticate2fa(@Request() req, @Body('token') token: string) {
        return this.authService.loginWith2fa(req.user, token);
    }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        const { password, fullName, ...rest } = createUserDto;
        return this.authService.register({
            ...rest,
            password_hash: password,
            full_name: fullName
        });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('2fa/generate')
    async generate2fa(@Request() req) {
        const { otpauthUrl, base32 } = await this.authService.generateTwoFactorSecret(req.user);

        const userId = req.user.userId || req.user.sub;
        await this.usersService.update(userId, {
            two_factor_secret: base32
        });

        return { otpauthUrl, base32 };
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('2fa/turn-on')
    @ApiBody({ schema: { example: { token: '123456' } } })
    async turnOn2fa(@Request() req, @Body('token') token: string) {
        const userId = req.user.userId || req.user.sub;
        const user = await this.usersService.findById(userId);

        if (!user || !user.two_factor_secret) {
            throw new UnauthorizedException('2FA secret not generated');
        }

        const isCodeValid = this.authService.validateTwoFactorCode(user.two_factor_secret, token);
        if (!isCodeValid) {
            throw new UnauthorizedException('Invalid 2FA token');
        }

        await this.usersService.update(userId, {
            two_factor_enabled: true
        });

        return { success: true };
    }

    @Get('invitation/validate/:token')
    async validateInvitation(@Param('token') token: string) {
        const user = await this.usersService.findByInviteToken(token);
        if (!user) {
            throw new UnauthorizedException('Invalid or expired invitation token');
        }
        return { email: user.email, fullName: user.full_name };
    }

    @Post('invitation/accept')
    async acceptInvitation(@Body() body: { token: string; password: string }) {
        return this.authService.acceptInvitation(body.token, body.password);
    }

    @Post('forgot-password')
    async forgotPassword(@Body() body: { email: string }) {
        await this.usersService.createPasswordResetToken(body.email);
        // Always return success to prevent email enumeration
        return { message: 'If the email exists, a reset link has been sent.' };
    }

    @Post('reset-password')
    async resetPassword(@Body() body: { token: string; password: string }) {
        return this.usersService.resetPasswordWithToken(body.token, body.password);
    }
}
