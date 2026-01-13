/**
 * Custom error classes for the application
 */

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  errors?: any[];

  constructor(message: string, errors?: any[]) {
    super(message, 400);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Format error for API response
 */
export function formatError(error: any): { message: string; statusCode: number; errors?: any[] } {
  if (error instanceof AppError) {
    const response: any = {
      message: error.message,
      statusCode: error.statusCode,
    };
    if (error instanceof ValidationError && error.errors) {
      response.errors = error.errors;
    }
    return response;
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError' && error.errors) {
    return {
      message: 'Validation error',
      statusCode: 400,
      errors: error.errors,
    };
  }

  // Generic error
  return {
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : error.message || 'Internal Server Error',
    statusCode: 500,
  };
}

/**
 * Log error with context
 */
export function logError(error: any, context?: Record<string, any>) {
  const errorInfo: any = {
    message: error.message,
    name: error.name,
    stack: error.stack,
  };

  if (context) {
    errorInfo.context = context;
  }

  if (error instanceof AppError) {
    errorInfo.statusCode = error.statusCode;
    errorInfo.isOperational = error.isOperational;
  }

  console.error('Error logged:', errorInfo);
}

