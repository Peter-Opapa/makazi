import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // exception.getResponse() for `new SomeHttpException("a string")` returns
    // the whole {statusCode, message, error} body, not just the message —
    // unwrap it so callers always get a plain string or string[] (the shape
    // apiFetch on the frontend expects), never a nested object.
    const rawResponse = exception instanceof HttpException ? exception.getResponse() : "Internal server error";
    const message =
      typeof rawResponse === "string"
        ? rawResponse
        : ((rawResponse as { message?: string | string[] })?.message ?? "Internal server error");

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
