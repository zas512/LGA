import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, tap } from "rxjs";

/**
 * Structured request logging. Replaces the ad-hoc `console.log` calls that were
 * scattered through the services (several of which printed JWTs and password
 * hashes to stdout).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: { sub?: string } }>();
    const { method, originalUrl } = request;
    const userId = request.user?.sub ?? "anonymous";
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = http.getResponse<Response>();
          this.logger.log(
            `${method} ${originalUrl} ${statusCode} ${Date.now() - startedAt}ms user=${userId}`
          );
        },
        error: (error: unknown) => {
          const status =
            error instanceof Error && "status" in error
              ? (error as { status: number }).status
              : 500;
          this.logger.warn(
            `${method} ${originalUrl} ${status} ${Date.now() - startedAt}ms user=${userId}`
          );
        }
      })
    );
  }
}
