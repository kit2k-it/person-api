import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If already in ApiResponse format, return as is
        if (data instanceof ApiResponseDto) {
          return data;
        }

        // Wrap data in ApiResponse
        return new ApiResponseDto({
          success: true,
          data,
        });
      }),
    );
  }
}