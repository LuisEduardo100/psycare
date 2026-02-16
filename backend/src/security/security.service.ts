import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
    private readonly algorithm = 'aes-256-cbc';
    private readonly key: Buffer;

    constructor(private configService: ConfigService) {
        const keyString = this.configService.get<string>('ENCRYPTION_KEY');
        if (!keyString || keyString.length !== 32) {
            throw new Error('ENCRYPTION_KEY must be 32 characters long');
        }
        this.key = Buffer.from(keyString);
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    decrypt(text: string): string {
        const textParts = text.split(':');
        const ivHex = textParts.shift();
        const encryptedTextHex = textParts.join(':');

        if (!ivHex || !encryptedTextHex) {
            throw new Error('Invalid encrypted text format');
        }

        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(encryptedTextHex, 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

    hash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}
