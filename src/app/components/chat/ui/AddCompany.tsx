import { Button } from "@/components/ui/button";
import { initAddQuickBookAccount } from "@/lib/api/intuitService";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsComponentOpen } from "@/lib/store/slices/uiSlice";
import { Building2, PlusIcon } from "lucide-react";
import React from "react";

const AddCompany = () => {
  const componentId = "sidebar-chat";
  const isSidebarOpen = useAppSelector((state) =>
    selectIsComponentOpen(state, componentId)
  );

  const handleNewCompanyClick = async () => {
    try {
      const redirectUrl = await initAddQuickBookAccount();
      if (redirectUrl) {
        window.open(redirectUrl, "_blank");
      } else {
        console.error("No redirect URL provided");
      }
    } catch (error) {
      console.error(error); // Handle error
    } finally {
    }
  };

  return (
    <div className="pt-3">
      {isSidebarOpen ? (
        <Button
          variant={"ghost"}
          onClick={handleNewCompanyClick}
          className="w-full flex justify-start text-light cursor-pointer items-center gap-2 bg-green-900"
        >
          <PlusIcon className="h-4 w-4" />
          New Company
        </Button>
      ) : (
        <Button className="w-full rounded-full flex items-center justify-center h-full bg-green-900 text-light">
          <Building2 className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default AddCompany;
