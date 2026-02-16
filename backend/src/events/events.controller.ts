import { Controller, Sse, UseGuards, Request, MessageEvent } from '@nestjs/common';
import { Observable, Subject, filter, map } from 'rxjs';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

interface SsePayload {
    doctorId: string;
    type: string;
    data: any;
}

@Controller('events')
export class EventsController {
    private events$ = new Subject<SsePayload>();

    constructor(private eventEmitter: EventEmitter2) { }

    @OnEvent('sse.event')
    handleSseEvent(payload: SsePayload) {
        this.events$.next(payload);
    }

    @Sse('stream')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('DOCTOR', 'SECRETARY')
    stream(@Request() req): Observable<MessageEvent> {
        const doctorId = req.user.userId;

        return this.events$.pipe(
            filter((event) => event.doctorId === doctorId),
            map((event) => ({
                data: JSON.stringify({
                    type: event.type,
                    ...event.data,
                }),
            } as MessageEvent)),
        );
    }
}
