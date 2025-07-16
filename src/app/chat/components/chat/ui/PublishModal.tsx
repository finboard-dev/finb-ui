"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePublishComponentMetrics } from "@/hooks/query-hooks/useComponentMetrics";
import { toast } from "sonner";
import { store } from "@/lib/store/store";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: string;
  defaultTitle: string;
}

type PublishType = "Global" | "Organization" | "Company";

export default function PublishModal({
  isOpen,
  onClose,
  componentId,
  defaultTitle,
}: PublishModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [publishType, setPublishType] = useState<PublishType>("Company");
  const data = store.getState().user;
  const compId = data.selectedCompany?.id;
  const orgId = data.selectedOrganization?.id;

  const publishMutation = usePublishComponentMetrics();

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      let data: any = {
        title: title.trim(), // camelCase key
        metricScope: publishType, // camelCase key
      };

      if (publishType === "Organization" && orgId) {
        data.orgId = orgId;
      } else if (publishType === "Company" && orgId && compId) {
        data.orgId = orgId;
        data.companyId = compId;
      }
      // For Global, do not send orgId or companyId

      await publishMutation.mutateAsync({ componentId, data });

      toast.success("Component published successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error publishing component:", error);
      toast.error(error?.message || "Failed to publish component");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="text-primary sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-primary">Publish Component</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-primary">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="selection:bg-gray-200"
              placeholder="Enter component title"
            />
          </div>

          {/* Publish Type Selection */}
          <div className="space-y-3">
            <Label>Publish Type</Label>
            <RadioGroup
              value={publishType}
              onValueChange={(value: PublishType) => setPublishType(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Global" id="global" />
                <Label htmlFor="global">Global</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Organization" id="organization" />
                <Label htmlFor="organization">Organization</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Company" id="company" />
                <Label htmlFor="company">Company</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Company Selection (only show if Company type is selected) */}

          {/* Info text */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            {publishType === "Global" && (
              <p>This component will be available globally</p>
            )}
            {publishType === "Organization" && (
              <p>This component will be available in your organization.</p>
            )}
            {publishType === "Company" && (
              <p>
                This component will be available to users in the current
                company.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-primary text-white"
            onClick={handlePublish}
            disabled={
              publishMutation.isPending ||
              !title.trim() ||
              (publishType === "Company" && !compId)
            }
          >
            {publishMutation.isPending ? "Publishing..." : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
