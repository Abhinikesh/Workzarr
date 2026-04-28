import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes safely using clsx and tailwind-merge.
 * Required for shadcn/ui components to handle conditional classes and style overrides.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
