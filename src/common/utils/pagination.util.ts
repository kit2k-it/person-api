export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class PaginationUtil {
  static async paginate<T>(
    query: any,
    page: number,
    limit: number,
  ): Promise<PaginationResult<T>> {
    const total = await query.count();
    const data = await query.skip((page - 1) * limit).take(limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static getTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }
}