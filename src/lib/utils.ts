
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLocaleFromCountry(countryCode: string): string {
  // Use 'en-US' for price formatting to ensure '.' is used as a decimal separator
  // but this can be adapted if other locale-specific formats are desired.
  // The currency symbol will still be determined by the currencyCode.
  return 'en-US';
}
