import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes dynamically.
 * This handles conditional classes and correctly resolves conflicts (e.g. padding override).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
