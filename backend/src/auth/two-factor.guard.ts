import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class TwoFactorGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }

        // specific role check?
        // if (user.role === 'DOCTOR' && !user.isTwoFactorAuthenticated) ...
        // For now, if 2FA is enabled but not authenticated, block.

        if (user.two_factor_enabled && !user.isTwoFactorAuthenticated) {
            throw new UnauthorizedException('2FA Required');
        }

        return true;
    }
}
