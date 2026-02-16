import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const isHttpException = exception instanceof HttpException;

        // Capture if it's NOT an http exception, OR if it is >= 500
        if (!isHttpException || (exception instanceof HttpException && exception.getStatus() >= 500)) {
            Sentry.captureException(exception);
        }

        super.catch(exception, host);
    }
}
