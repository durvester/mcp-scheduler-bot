import { z, ZodSchema, ZodError } from 'zod';
import { Logger } from './Logger.js';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export class ValidationUtil {
  private static logger = Logger.create('ValidationUtil');

  static validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
    try {
      const validatedData = schema.parse(data);
      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => {
          const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
          return `${path}${err.message}`;
        });
        
        this.logger.debug('Validation failed', {
          errors,
          inputData: typeof data === 'object' ? JSON.stringify(data) : String(data)
        });
        
        return {
          success: false,
          errors
        };
      }
      
      // Handle unexpected errors
      this.logger.error('Unexpected validation error', {}, error as Error);
      return {
        success: false,
        errors: ['Unexpected validation error occurred']
      };
    }
  }

  static async validateAsync<T>(schema: ZodSchema<T>, data: unknown): Promise<ValidationResult<T>> {
    return this.validate(schema, data);
  }

  static createValidationMiddleware<T>(schema: ZodSchema<T>) {
    return (data: unknown): T => {
      const result = this.validate(schema, data);
      if (!result.success) {
        throw new ValidationError(`Validation failed: ${result.errors?.join(', ')}`);
      }
      return result.data!;
    };
  }

  static sanitizePhoneNumber(phone?: string): string | undefined {
    if (!phone) return undefined;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle US numbers with country code
    if (digits.length === 11 && digits.startsWith('1')) {
      return digits.slice(1);
    }
    
    // Return only if it's exactly 10 digits
    return digits.length === 10 ? digits : undefined;
  }

  static sanitizeZipCode(zip?: string): string | undefined {
    if (!zip) return undefined;
    
    // Allow 5-digit or 5+4 format
    const cleanZip = zip.replace(/[^\d-]/g, '');
    return /^\d{5}(-\d{4})?$/.test(cleanZip) ? cleanZip : undefined;
  }

  static sanitizeEmail(email?: string): string | undefined {
    if (!email) return undefined;
    
    const trimmed = email.trim().toLowerCase();
    // Basic email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : undefined;
  }

  static sanitizeGuid(guid?: string): string | undefined {
    if (!guid) return undefined;
    
    const trimmed = guid.trim().toLowerCase();
    // UUID v4 format validation
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(trimmed) 
      ? trimmed 
      : undefined;
  }

  static sanitizeDate(date?: string): string | undefined {
    if (!date) return undefined;
    
    // Try to parse and reformat to MM/DD/YYYY
    const trimmed = date.trim();
    
    // Handle various date formats
    let parsed: Date | null = null;
    
    // Try M/D/YYYY or MM/DD/YYYY format first
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [month, day, year] = trimmed.split('/');
      parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Try YYYY-M-D or YYYY-MM-DD format
    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
      parsed = new Date(trimmed);
    }
    
    if (parsed && !isNaN(parsed.getTime())) {
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      const year = parsed.getFullYear();
      return `${month}/${day}/${year}`;
    }
    
    return undefined;
  }

  static createErrorResponse(errors: string[]): object {
    return {
      content: [{
        type: "text",
        text: `Validation error: ${errors.join('; ')}`
      }]
    };
  }

  static isValidEnum<T extends Record<string, string>>(
    value: string, 
    enumObject: T
  ): value is T[keyof T] {
    return Object.values(enumObject).includes(value as T[keyof T]);
  }

  // Common validation patterns
  static readonly PATTERNS = {
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?1?[- .]?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}$/,
    PHONE_DIGITS_ONLY: /^\d{10}$/,
    ZIP_CODE: /^\d{5}(-\d{4})?$/,
    STATE_CODE: /^[A-Za-z]{2}$/,
    SSN: /^\d{3}-?\d{2}-?\d{4}$/,
    DATE_MM_DD_YYYY: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    DATE_YYYY_MM_DD: /^\d{4}-\d{1,2}-\d{1,2}$/,
    TIME_DURATION: /^\d+:\d{2}:\d{2}$/
  } as const;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Export convenience functions
export const validate = ValidationUtil.validate;
export const createValidationMiddleware = ValidationUtil.createValidationMiddleware;