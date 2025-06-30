import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ChevronsUpDown, Check, Loader2 } from "lucide-react";
import {
  selectUser,
  selectSelectedOrganization,
  setSelectedOrganization,
  setUserData,
  type Organization,
  type UserOrganization,
} from "@/lib/store/slices/userSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  initializeComponent,
  toggleComponent,
} from "@/lib/store/slices/uiSlice";
import { useSearchParams, useRouter } from "next/navigation";
import { toggleSidebar } from "@/lib/store/slices/chatSlice";
import {
  setDropDownLoading,
  selectDropDownLoading,
} from "@/lib/store/slices/loadingSlice";
import { useUrlParams } from "@/lib/utils/urlParams";

interface OrganizationDropdownProps {
  onOrganizationChange?: () => void;
}

export const OrganizationDropdown: React.FC<OrganizationDropdownProps> = ({
  onOrganizationChange,
}) => {
  const [error, setError] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isParamSet, toggleComponentState } = useUrlParams();
  const componentId = "dropdown-organization";

  const user = useSelector(selectUser);
  const selectedOrganization = useSelector(selectSelectedOrganization);

  // Get dropdown state from URL parameters (source of truth)
  const isOpen = isParamSet(componentId, "open");

  // Sync URL parameters to Redux state
  useEffect(() => {
    dispatch(
      initializeComponent({
        type: "dropdown",
        id: componentId,
        isOpenFromUrl: isOpen,
      })
    );
  }, [dispatch, componentId, isOpen]);

  const handleToggle = () => {
    const newState = !isOpen;
    toggleComponentState(componentId, newState);
  };

  // Handle organization selection
  const handleOrganizationSelect = async (userOrg: UserOrganization) => {
    setError(null);
    dispatch(setDropDownLoading(true));

    try {
      // Create the organization object in the expected format
      const organizationToSelect: Organization = {
        id: userOrg.organization.id,
        name: userOrg.organization.name,
        status: userOrg.organization.status,
        companies: [], // Will be populated when companies are loaded
        role: {
          id: userOrg.role.id,
          name: userOrg.role.name,
          permissions: [], // You might need to fetch permissions separately
        },
      };

      // Update the selected organization
      dispatch(setSelectedOrganization(organizationToSelect));

      // Update the user's role to match the selected organization's role
      if (user) {
        const updatedUser = {
          ...user,
          role: {
            id: userOrg.role.id,
            key: userOrg.role.key,
            name: userOrg.role.name,
            permissions: [], // You might need to fetch permissions separately
          },
          selectedOrganization: organizationToSelect,
        };

        dispatch(
          setUserData({
            user: updatedUser,
            selectedOrganization: organizationToSelect,
          })
        );
      }

      // Close dropdown
      dispatch(toggleComponent({ id: componentId, forceState: false }));
      toggleComponentState(componentId, false);

      if (onOrganizationChange) onOrganizationChange();
    } catch (err: any) {
      console.error("Error setting organization:", err);
      setError(err.message || "Error setting organization");
    } finally {
      dispatch(setDropDownLoading(false));
    }
  };

  // Get organizations from the nested structure
  const organizations: UserOrganization[] = user?.organizations || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        dispatch(toggleComponent({ id: componentId, forceState: false }));
        toggleComponentState(componentId, false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dispatch, searchParams, router]);

  if (!selectedOrganization || !user) return null;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="flex w-full hover:cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left shadow-sm hover:bg-gray-50 focus:outline-none transition-all duration-200"
        onClick={handleToggle}
        id="dropdown-organization-button"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-primary to-primary/80 text-white shadow-inner">
            <span className="text-xs font-semibold">
              {selectedOrganization?.name?.substring(0, 2).toUpperCase() ||
                "SO"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 line-clamp-1">
              {selectedOrganization?.name || "Select Organization"}
            </span>
            <span className="text-xs text-gray-500 line-clamp-1">
              {user?.role?.name}
            </span>
          </div>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-gray-500 shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Organizations list */}
          <div className="max-h-64 overflow-y-auto py-1">
            {organizations.map((org) => {
              const isSelected =
                org.organization.id === selectedOrganization?.id;
              return (
                <div
                  key={org.organization.id}
                  className={`group mx-1 my-0.5 flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => handleOrganizationSelect(org)}
                  id={`click-organization-${org.organization.id}`}
                >
                  <div className="flex flex-grow flex-col">
                    <span className="text-sm font-medium">
                      {org.organization.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {org.role.name}
                    </span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              );
            })}
          </div>

          {/* Error display */}
          {error && (
            <div className="border-t border-red-100 bg-red-50 p-2">
              <span className="text-xs text-red-600">{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const CollapsedOrganizationDropdown: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedOrganization = useAppSelector(selectSelectedOrganization);
  const isLoading = useAppSelector(selectDropDownLoading);

  const handleClick = () => {
    dispatch(toggleSidebar());
  };

  return (
    <div className="w-full flex justify-center px-2 py-2">
      <button
        type="button"
        id="collapsed-organization-button"
        className="flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50 shadow-sm transition-all duration-200"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
        ) : selectedOrganization ? (
          <div className="relative flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 text-white">
            <span className="text-xs text-white font-semibold">
              {selectedOrganization && selectedOrganization.name
                ? selectedOrganization.name.substring(0, 1).toUpperCase()
                : "SO"}
            </span>
          </div>
        ) : (
          <div className="h-4 w-4 text-gray-500" />
        )}
      </button>
    </div>
  );
};
