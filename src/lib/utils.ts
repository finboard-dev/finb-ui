import { clsx as clsxn, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsxn(inputs))
}


export function clsx(...classes: (string | boolean | ClassValue[] | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}