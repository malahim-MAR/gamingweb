import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatScore(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}
export function utcDay() {
  return new Date().toISOString().slice(0, 10);
}
