"use client";
import React, { useEffect, useState, useRef } from "react";
import { Sidebar } from "../components/Sidebar";
import { ConsolidationHeader } from "../components/ConsolidationHeader";
import { Stepper } from "../components/Stepper";
import { ConsolidationMain } from "../components/ConsolidationMain";
import { CompanyModal } from "@/app/components/chat/sidebar/CompanyModal";
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

export default function ConsolidationPage() {
  const router = useRouter();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const createAccountsRef = useRef<CreateAccountsRef>(null);

  const selectedCompanyId = useSelector(
    (state: any) => state.user.selectedCompany?.id
  );
  const consolidationId = params.id as string;
  const companies = store.getState().user.companies;
  const realmId = companies.find(
    (company: any) => company.id === selectedCompanyId
  )?.realmId;

  // Sync URL with selectedCompany
  useEffect(() => {
    if (selectedCompanyId && selectedCompanyId !== consolidationId) {
      router.replace(`/consolidation/${selectedCompanyId}`);
    }
  }, [selectedCompanyId, consolidationId, router]);

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
            onNext={() => setCurrentStep(2)}
            selectedCompanyId={selectedCompanyId}
          />
        );
      case 2:
        return (
          <AdjustEliminations
            onNext={() => setCurrentStep(3)}
            selectedCompanyId={selectedCompanyId}
          />
        );
      case 3:
        return <ReviewFinalize selectedCompanyId={selectedCompanyId} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex bg-white h-screen  overflow-hidden">
        <Sidebar />
        <ConsolidationMain>
          <ConsolidationHeader onBack={() => window.history.back()} />
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
