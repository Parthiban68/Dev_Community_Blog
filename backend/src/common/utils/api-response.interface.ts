export interface ApiResponse<T> {
  date: string;
  message: string;
  statusCode: number;
  records: T;
}
