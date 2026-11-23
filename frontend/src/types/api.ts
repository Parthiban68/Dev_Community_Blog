export interface ApiEnvelope<T> {
  date: string;
  message: string;
  statusCode: number;
  records: T;
}
