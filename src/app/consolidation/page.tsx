"use client";

import React, { useEffect } from "react";
import LoadingAnimation from "../../components/ui/common/GlobalLoading";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useInactiveCompany } from "@/hooks/useInactiveCompany";

const page = () => {
  const router = useRouter();
  const params = useParams();
  const selectedCompanyId = useSelector(
    (state: any) => state.user.selectedCompany?.id
  );
  const consolidationId = params.id as string;

  // Check if company is inactive
  const { isCompanyInactive, InactiveCompanyUI } = useInactiveCompany();

  // Sync URL with selectedCompany
  useEffect(() => {
    if (selectedCompanyId && selectedCompanyId !== consolidationId) {
      router.replace(`/consolidation/${selectedCompanyId}`);
    }
  }, [selectedCompanyId, consolidationId, router]);

  // If company is inactive, show the inactive company UI
  if (isCompanyInactive) {
    return <InactiveCompanyUI title="Mapping" />;
  }

  return <LoadingAnimation message={"Loading consolidation"} />;
};

export default page;
