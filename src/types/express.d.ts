declare global {
  namespace Express {
    interface Request {
      userId?: string;
      accessKeyId?: string;
    }
  }
}

// This export is needed to make this file a module
export {};