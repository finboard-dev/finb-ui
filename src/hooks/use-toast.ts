import { toast } from "sonner";

export function useToast() {
  return {
    toast: (message: string, options?: { variant?: "default" | "destructive" | "success" }) => {
      const { variant = "default" } = options || {};
      
      switch (variant) {
        case "destructive":
          return toast.error(message);
        case "success":
          return toast.success(message);
        default:
          return toast(message);
      }
    },
    error: (message: string) => toast.error(message),
    success: (message: string) => toast.success(message),
    warning: (message: string) => toast.warning(message),
    info: (message: string) => toast.info(message),
  };
} 