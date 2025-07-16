import * as React from "react";
import { cn } from "@/lib/utils";

export interface TypographyProps {
  variant?: 
    | "h1" 
    | "h2" 
    | "h3" 
    | "h4" 
    | "h5" 
    | "h6" 
    | "subtitle1" 
    | "subtitle2" 
    | "body1" 
    | "body2" 
    | "caption" 
    | "overline"
    | "muted"
    | "xs"
    | "sm"
    | "lg"
    | "xl";
  className?: string;
  children: React.ReactNode;
  title?: string;
}

const variantStyles = {
  h1: "text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100",
  h2: "text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100",
  h3: "text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100",
  h4: "text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100",
  h5: "text-lg font-medium text-slate-900 dark:text-slate-100",
  h6: "text-base font-medium text-slate-900 dark:text-slate-100",
  subtitle1: "text-base font-medium text-slate-700 dark:text-slate-300",
  subtitle2: "text-sm font-medium text-slate-600 dark:text-slate-400",
  body1: "text-base text-slate-700 dark:text-slate-300",
  body2: "text-sm text-slate-600 dark:text-slate-400",
  caption: "text-xs text-slate-500 dark:text-slate-500",
  overline: "text-xs uppercase tracking-wide text-slate-500 dark:text-slate-500",
  muted: "text-sm text-muted-foreground",
  xs: "text-xs text-slate-600 dark:text-slate-400",
  sm: "text-sm text-slate-700 dark:text-slate-300",
  lg: "text-lg text-slate-900 dark:text-slate-100",
  xl: "text-xl text-slate-900 dark:text-slate-100",
};

const variantElements = {
  h1: "h1",
  h2: "h2", 
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "h6",
  subtitle2: "h6",
  body1: "p",
  body2: "p",
  caption: "span",
  overline: "span",
  muted: "p",
  xs: "span",
  sm: "span",
  lg: "p",
  xl: "p",
} as const;

export const Typography = React.forwardRef<
  HTMLElement,
  TypographyProps
>(({ variant = "body1", className, children, title, ...props }, ref) => {
  const Component = variantElements[variant] as any;
  
  return (
    <Component
      ref={ref}
      className={cn(variantStyles[variant], className)}
      title={title}
      {...props}
    >
      {children}
    </Component>
  );
});

Typography.displayName = "Typography";
