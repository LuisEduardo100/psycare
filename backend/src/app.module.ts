import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { SecurityModule } from './security/security.module';
import { AuditModule } from './audit/audit.module';
import { ConsentModule } from './consent/consent.module';
import { PatientModule } from './patient/patient.module';
import { MedicalModule } from './medical/medical.module';
import { SafetyModule } from './safety/safety.module';
import { DocumentModule } from './document/document.module';
import { NotificationModule } from './notification/notification.module';
import { EventsModule } from './events/events.module';
import { MailModule } from './common/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    SecurityModule,
    AuditModule,
    ConsentModule,
    PatientModule,
    MedicalModule,
    SafetyModule,
    DocumentModule,
    NotificationModule,
    NotificationModule,
    EventsModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

