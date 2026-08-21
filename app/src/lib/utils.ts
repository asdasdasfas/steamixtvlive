import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(s: string): string {
  return (s || '')
    .toString()
    .toLowerCase()
    .replace(/[ış]/g, 'i').replace(/[İ]/g, 'i')
    .replace(/[ş]/g, 's').replace(/[Ş]/g, 's')
    .replace(/[ğ]/g, 'g').replace(/[Ğ]/g, 'g')
    .replace(/[ü]/g, 'u').replace(/[Ü]/g, 'u')
    .replace(/[ö]/g, 'o').replace(/[Ö]/g, 'o')
    .replace(/[ç]/g, 'c').replace(/[Ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
