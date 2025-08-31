declare global {
  namespace Express {
    interface Request {
      user?: any;
      adminUser?: any;
      apiAccessKeyId?: string;
    }
  }
}

// This export is needed to make this file a module
export {};
