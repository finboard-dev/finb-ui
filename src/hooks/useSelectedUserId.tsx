import { useAppSelector } from "@/lib/store/hooks";
import { selectedUserId } from "@/lib/store/slices/userSlice";

export const useSelectedUserId = () => {
  // Use Redux selector directly with useAppSelector hook
  const userId = useAppSelector(selectedUserId);
  return userId;
};
