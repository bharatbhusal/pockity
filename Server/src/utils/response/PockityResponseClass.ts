/**
 * Standard response class for all successful API responses
 * Ensures consistent response format across the application
 * @template T - The type of data being returned in the response
 */
export class PockityBaseResponse<T = any> {
  /** Indicates if the operation was successful (always true for this class) */
  success: boolean;
  /** Human-readable message describing the operation result */
  message: string;
  /** Optional data payload returned by the operation */
  data?: T;
  /** Optional metadata like pagination info, counts, etc. */
  meta?: any;

  /**
   * Creates a new successful response instance
   * @param params - Response parameters
   * @param params.success - Success flag (should always be true)
   * @param params.message - Success message
   * @param params.data - Optional response data
   * @param params.meta - Optional metadata
   */
  constructor({ success, message, data, meta }: { success: boolean; message: string; data?: T; meta?: any }) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  /**
   * Converts the response to a plain JSON object
   * @returns Plain object representation of the response
   */
  toJSON() {
    return {
      success: this.success,
      message: this.message,
      data: this.data,
      meta: this.meta,
    };
  }
}
