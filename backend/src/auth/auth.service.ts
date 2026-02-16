import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        if (user && (await bcrypt.compare(pass, user.password_hash))) {
            const { password_hash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id || user.userId,
            role: user.role,
            fullName: user.full_name || user.fullName,
            phone: user.phone,
            isTwoFactorAuthenticated: false
        };

        if (user.two_factor_enabled) {
            return {
                requires_2fa: true,
                access_token: this.jwtService.sign({ ...payload, isTwoFactorAuthenticated: false }),
            };
        }

        return {
            access_token: this.jwtService.sign({ ...payload, isTwoFactorAuthenticated: true }),
            refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
        };
    }

    async loginWith2fa(user: any, token: string) {
        const userId = user.userId || user.sub;
        const fullUser = await this.usersService.findById(userId);
        if (!fullUser || !fullUser.two_factor_secret) {
            throw new UnauthorizedException('2FA not set up');
        }

        const verified = speakeasy.totp.verify({
            secret: fullUser.two_factor_secret,
            encoding: 'base32',
            token: token
        });

        if (!verified) {
            throw new UnauthorizedException('Invalid 2FA token');
        }

        const payload = {
            email: user.email,
            sub: userId,
            role: user.role,
            fullName: user.full_name || user.fullName,
            phone: fullUser.phone,
            isTwoFactorAuthenticated: true
        };

        return {
            access_token: this.jwtService.sign(payload),
            refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
        };
    }

    async register(user: any) {
        const existingUser = await this.usersService.findOne(user.email);
        if (existingUser) {
            throw new UnauthorizedException('User already exists');
        }
        const newUser = await this.usersService.create(user);
        return this.login(newUser);
    }

    async generateTwoFactorSecret(user: any) {
        const secret = speakeasy.generateSecret({
            name: `PsyCare (${user.email})`,
        });
        return {
            otpauthUrl: secret.otpauth_url,
            base32: secret.base32,
        };
    }

    validateTwoFactorCode(userTwoFactorSecret: string, token: string): boolean {
        return speakeasy.totp.verify({
            secret: userTwoFactorSecret,
            encoding: 'base32',
            token,
        });
    }

    async acceptInvitation(token: string, password: string) {
        const user = await this.usersService.findByInviteToken(token);
        if (!user) {
            throw new UnauthorizedException('Invalid or expired invitation token');
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatedUser = await this.usersService.update(user.id, {
            password_hash: hashedPassword,
            invite_token: null,
            invite_expires: null,
        });

        return this.login(updatedUser);
    }
}
