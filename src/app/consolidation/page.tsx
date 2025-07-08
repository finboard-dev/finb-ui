"use client";

import React, { useEffect } from "react";
import LoadingAnimation from "../components/common/ui/GlobalLoading";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";

const page = () => {
  const router = useRouter();
  const params = useParams();
  const selectedCompanyId = useSelector(
    (state: any) => state.user.selectedCompany?.id
  );
  const consolidationId = params.id as string;

  // Sync URL with selectedCompany
  useEffect(() => {
    if (selectedCompanyId && selectedCompanyId !== consolidationId) {
      router.replace(`/consolidation/${selectedCompanyId}`);
    }
  }, [selectedCompanyId, consolidationId, router]);
  return <LoadingAnimation message={"Loading consolidation"} />;
};

export default page;
