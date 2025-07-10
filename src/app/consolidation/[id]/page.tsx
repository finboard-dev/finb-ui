"use client";
import React, { useEffect, useState, useRef } from "react";
import { Sidebar } from "../components/Sidebar";
import { ConsolidationHeader } from "../components/ConsolidationHeader";
import { Stepper } from "../components/Stepper";
import { ConsolidationMain } from "../components/ConsolidationMain";
import { ConsolidationFooter } from "../components/ConsolidationFooter";
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
  const [currentStep, setCurrentStep] = useState(1);
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

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      window.history.back();
    }
  };

  const handleSaveAndNext = async () => {
    if (currentStep === 0) {
      // For step 1, use the CreateAccounts component's save functionality
      if (createAccountsRef.current) {
        await createAccountsRef.current.handleSaveAndNext();
      }
    } else {
      // For other steps, just proceed to next step
      handleNext();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <CreateAccounts
            ref={createAccountsRef}
            onNext={handleNext}
            onBack={handleBack}
            selectedCompanyId={selectedCompanyId}
          />
        );
      case 1:
        return (
          <LinkAccounts
            onNext={handleNext}
            onBack={handleBack}
            selectedCompanyId={selectedCompanyId}
          />
        );
      case 2:
        return (
          <AdjustEliminations
            onNext={handleNext}
            onBack={handleBack}
            selectedCompanyId={selectedCompanyId}
          />
        );
      case 3:
        return (
          <ReviewFinalize
            onBack={handleBack}
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
        <Sidebar />
        <ConsolidationMain>
          <ConsolidationHeader onBack={() => window.history.back()} />
          <Stepper currentStep={currentStep} />
          {renderCurrentStep()}
        </ConsolidationMain>
      </div>
      <CompanyModal />
    </>
  );
}
