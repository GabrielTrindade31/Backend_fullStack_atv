import 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        role: string;
        token: string;
      };
    }
  }
}

export {};
