export class ApiResponseDto<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  errors?: any[];

  constructor(data: Partial<ApiResponseDto<T>>) {
    this.success = data.success ?? true;
    this.message = data.message;
    this.data = data.data;
    this.meta = data.meta;
    this.errors = data.errors;
  }

  static success<T>(data: T, message?: string, meta?: any): ApiResponseDto<T> {
    return new ApiResponseDto<T>({
      success: true,
      message,
      data,
      meta,
    });
  }

  static error(message: string, errors?: any[]): ApiResponseDto<null> {
    return new ApiResponseDto<null>({
      success: false,
      message,
      errors,
    });
  }
}