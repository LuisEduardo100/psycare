import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    async sendInvitationEmail(to: string, token: string, name: string) {
        const url = `http://localhost:3000/accept-invitation/${token}`;

        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao PsyCare</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background-color: #0d9488; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">PsyCare</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Olá, ${name}!</h2>
            <p style="color: #4b5563; margin-bottom: 24px;">Você foi convidado(a) para acessar a plataforma <strong>PsyCare</strong>. Estamos felizes em tê-lo(a) conosco!</p>
            <p style="color: #4b5563; margin-bottom: 30px;">Para completar seu cadastro e definir sua senha de acesso, clique no botão abaixo:</p>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="${url}" style="background-color: #0d9488; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.3);">
                    Aceitar Convite
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">O link expira em 48 horas.</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 13px; margin-bottom: 5px;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                <a href="${url}" style="color: #0d9488; font-size: 13px; word-break: break-all;">${url}</a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} PsyCare. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
        `;

        await this.transporter.sendMail({
            from: this.configService.get<string>('EMAIL_FROM') || '"PsyCare" <noreply@psycare.com>',
            to,
            subject: 'Bem-vindo ao PsyCare - Complete seu cadastro',
            html: htmlTemplate,
        });
    }

    async sendPasswordResetEmail(to: string, token: string, name: string) {
        const url = `http://localhost:3000/reset-password/${token}`;

        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Senha - PsyCare</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background-color: #0d9488; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">PsyCare</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Olá, ${name}!</h2>
            <p style="color: #4b5563; margin-bottom: 24px;">Recebemos uma solicitação para redefinir sua senha no <strong>PsyCare</strong>.</p>
            <p style="color: #4b5563; margin-bottom: 30px;">Se foi você, clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="${url}" style="background-color: #0d9488; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.3);">
                    Redefinir Senha
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">O link expira em 1 hora.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">Se você não solicitou essa alteração, ignore este e-mail.</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 13px; margin-bottom: 5px;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                <a href="${url}" style="color: #0d9488; font-size: 13px; word-break: break-all;">${url}</a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} PsyCare. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
        `;

        await this.transporter.sendMail({
            from: this.configService.get<string>('EMAIL_FROM') || '"PsyCare" <noreply@psycare.com>',
            to,
            subject: 'Recuperação de Senha - PsyCare',
            html: htmlTemplate,
        });
    }

    async sendEmailChangeConfirmation(to: string, token: string, name: string) {
        const url = `http://localhost:3000/confirm-email/${token}`;
        // Using a similar template for consistency
        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmação de Alteração de Email - PsyCare</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background-color: #0d9488; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">PsyCare</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Olá, ${name}!</h2>
            <p style="color: #4b5563; margin-bottom: 24px;">Recebemos uma solicitação para alterar seu email no <strong>PsyCare</strong>.</p>
            <p style="color: #4b5563; margin-bottom: 30px;">Para confirmar essa alteração, clique no botão abaixo:</p>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="${url}" style="background-color: #0d9488; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.3);">
                    Confirmar Email
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">O link expira em 24 horas.</p>
            
             <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 13px; margin-bottom: 5px;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                <a href="${url}" style="color: #0d9488; font-size: 13px; word-break: break-all;">${url}</a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} PsyCare. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
        `;

        await this.transporter.sendMail({
            from: this.configService.get<string>('EMAIL_FROM') || '"PsyCare" <noreply@psycare.com>',
            to,
            subject: 'Confirme seu novo email - PsyCare',
            html: htmlTemplate,
        });
    }
}
