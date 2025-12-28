import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parse an integer from a string, returning a default value if invalid
 * @param value - The string to parse
 * @param defaultValue - Default value if parsing fails (default: 0)
 * @param min - Minimum allowed value (optional)
 * @param max - Maximum allowed value (optional)
 */
export function safeParseInt(
  value: string | null | undefined,
  defaultValue: number = 0,
  min?: number,
  max?: number
): number {
  if (value == null || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  return parsed;
}
