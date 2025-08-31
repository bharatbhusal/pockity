export class PockityBaseResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: any;

  constructor({ success, message, data, meta }: { success: boolean; message: string; data?: T; meta?: any }) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  toJSON() {
    return {
      success: this.success,
      message: this.message,
      data: this.data,
      meta: this.meta,
    };
  }
}
