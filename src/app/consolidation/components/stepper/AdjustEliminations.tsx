"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, ArrowRight } from "lucide-react";

interface AdjustEliminationsProps {
  onNext: () => void;
  selectedCompanyId: string;
}

export function AdjustEliminations({
  onNext,
  selectedCompanyId,
}: AdjustEliminationsProps) {
  return <>hi</>;
}
