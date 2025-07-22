"use client";
import React, { useEffect, useState, useRef } from "react";
import { ConsolidationHeader } from "../components/ConsolidationHeader";
import { Stepper } from "../components/Stepper";
import { ConsolidationMain } from "../components/ConsolidationMain";
import { CompanyModal } from "@/components/ui/common/CompanyModal";
import {
  CreateAccounts,
  CreateAccountsRef,
} from "../components/stepper/CreateAccounts";
import { LinkAccounts } from "../components/stepper/LinkAccounts";
import { AdjustEliminations } from "../components/stepper/AdjustEliminations";
import { ReviewFinalize } from "../components/stepper/ReviewFinalize";
import { store } from "@/lib/store/store";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { Sidebar } from "@/components/ui/common/sidebar";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  selectIsComponentOpen,
  toggleComponent,
} from "@/lib/store/slices/uiSlice";
import { useInactiveCompany } from "@/hooks/useInactiveCompany";
import { useCompanyData } from "@/hooks/query-hooks/useCompany";
import { useUrlSync } from "@/hooks/useUrlSync";
import LoadingAnimation from "@/components/ui/common/GlobalLoading";

export default function ConsolidationPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();

  const selectedCompanyId = useSelector(
    (state: any) => state.user.selectedCompany?.id
  );
  const consolidationId = params.id as string;

  // Use URL sync to ensure proper organization and company initialization
  const { isAuthenticated, isSyncing } = useUrlSync({
    syncFromUrl: true,
    syncToUrl: false,
    validateAccess: true,
  });

  // Fetch company data - always fetch companies list, and current company if available
  const {
    isLoading: isCompanyDataLoading,
    error: companyDataError,
    hasOrganization,
  } = useCompanyData(selectedCompanyId);

  // Check if company is inactive
  const { isCompanyInactive, InactiveCompanyUI } = useInactiveCompany();

  // Use component-based sidebar state
  const isSidebarOpen = useAppSelector((state) =>
    selectIsComponentOpen(state, "sidebar-chat")
  );
  const isSidebarCollapsed = !isSidebarOpen;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const createAccountsRef = useRef<CreateAccountsRef>(null);
  const linkAccountsRef = useRef<any>(null);

  const companies = store.getState().user.companies;
  const realmId = companies.find(
    (company: any) => company.id === selectedCompanyId
  )?.realmId;

  // Initialize sidebar component if it doesn't exist
  useEffect(() => {
    dispatch({
      type: "ui/initializeComponent",
      payload: {
        type: "sidebar",
        id: "sidebar-chat",
        isOpenFromUrl: true, // Default to open
      },
    });
  }, [dispatch]);

  // Sync URL with selectedCompany
  useEffect(() => {
    if (selectedCompanyId && selectedCompanyId !== consolidationId) {
      router.replace(`/consolidation/${selectedCompanyId}`);
    }
  }, [selectedCompanyId, consolidationId, router]);

  // Show loading while URL sync or company data is being fetched
  if (isSyncing || isCompanyDataLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-transparent">
        <LoadingAnimation
          message={isSyncing ? "Initializing..." : "Loading company data..."}
        />
      </div>
    );
  }

  // If no organization is selected, show message
  if (!hasOrganization) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-transparent">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to continue.
          </p>
        </div>
      </div>
    );
  }

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    setIsSaved(false); // Reset saved state when changing tabs
  };

  const handleSave = async () => {
    setIsSaving(true);
    setIsSaved(false);

    try {
      if (currentStep === 0) {
        // For step 1, use the CreateAccounts component's save functionality
        if (createAccountsRef.current) {
          await createAccountsRef.current.handleSave();
        }
      } else if (currentStep === 1) {
        // For step 2, use the LinkAccounts component's save functionality
        if (linkAccountsRef.current) {
          await linkAccountsRef.current.handleSave();
        }
      } else {
        // For other steps, simulate save operation
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setIsSaved(true);
      // Reset saved state after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSidebarToggle = () => {
    dispatch(toggleComponent({ id: "sidebar-chat" }));
  };

  // If company is inactive, show the inactive company UI
  if (isCompanyInactive) {
    return <InactiveCompanyUI title="Mapping" />;
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <CreateAccounts
            ref={createAccountsRef}
            onNext={() => setCurrentStep(1)}
            selectedCompanyId={selectedCompanyId}
          />
        );
      case 1:
        return (
          <LinkAccounts
            ref={linkAccountsRef}
            onNext={() => setCurrentStep(2)}
            selectedCompanyId={selectedCompanyId}
          />
        );
      case 2:
        return <ReviewFinalize selectedCompanyId={selectedCompanyId} />;
      case 3:
        return (
          <AdjustEliminations
            onNext={() => setCurrentStep(4)}
            selectedCompanyId={selectedCompanyId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex bg-white h-screen  overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <ConsolidationMain>
          <ConsolidationHeader
            collpaseSidebar={handleSidebarToggle}
            isCollapsed={isSidebarCollapsed}
          />
          <Stepper
            currentStep={currentStep}
            onStepChange={handleStepChange}
            onSave={handleSave}
            isSaving={isSaving}
            isSaved={isSaved}
          />
          {renderCurrentStep()}
        </ConsolidationMain>
      </div>
      <CompanyModal />
    </>
  );
}
