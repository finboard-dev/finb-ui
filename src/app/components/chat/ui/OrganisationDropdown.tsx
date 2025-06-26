import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ChevronsUpDown, Building, Users, Check, Loader2 } from "lucide-react";
import {
  selectUser,
  selectSelectedOrganization,
  selectSelectedCompany,
  setSelectedOrganization,
  setSelectedCompany,
  type Organization,
  type Company,
} from "@/lib/store/slices/userSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  initializeComponent,
  selectIsComponentOpen,
  toggleComponent,
} from "@/lib/store/slices/uiSlice";
import { useSearchParams, useRouter } from "next/navigation";
import {
  clearAllChats,
  clearMessages,
  toggleSidebar,
} from "@/lib/store/slices/chatSlice";
import {
  setDropDownLoading,
  selectDropDownLoading,
} from "@/lib/store/slices/loadingSlice";
import { initAddQuickBookAccount } from "@/lib/api/intuitService";
import { fetcher } from "@/lib/axios/config";
import { getCurrentCompany } from "@/lib/api/allCompany";
import connectToQuickBooksMed from "@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_med_default.svg";
import connectToQuickBooksHoverMed from "@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_med_hover.svg";
import Image from "next/image";
import { useUrlParams } from "@/lib/utils/urlParams";
import { addConnection } from "@/lib/api/settings";

interface OrganizationDropdownProps {
  onCompanyChange?: () => void;
}

enum CompanyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export const OrganizationDropdown: React.FC<OrganizationDropdownProps> = ({
  onCompanyChange,
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
  const selectedCompany = useSelector(selectSelectedCompany);
  // const isLoading = useAppSelector(selectDropDownLoading);
  const [quickBooksImgSrc, setQuickBooksImgSrc] = useState(
    connectToQuickBooksMed
  );

  const companies = useAppSelector((state) => state.user.companies);

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

  const handleAddQuickBooks = async () => {
    try {
      const redirectUrl = await addConnection();
      if (redirectUrl.redirectUrl) {
        window.open(redirectUrl.redirectUrl, "_self");
      } else {
        console.error("No redirect URL provided");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOrganizationSelect = (organization: Organization) => {
    dispatch(setSelectedOrganization(organization));
  };

  // Get organizations and companies from Redux
  const organizations = useAppSelector(
    (state) => state.user.user?.organizations || []
  );

  const handleCompanySelect = async (org: Organization, company: Company) => {
    setError(null);
    dispatch(clearAllChats());
    dispatch(setSelectedOrganization(org));

    // Set loading state to true
    dispatch(setDropDownLoading(true));

    try {
      const response = await getCurrentCompany(company.id);
      dispatch(setSelectedCompany(response?.data || response));
      document.cookie = "has_selected_company=true; path=/";
      dispatch(toggleComponent({ id: componentId, forceState: false }));
      toggleComponentState(componentId, false);
      if (onCompanyChange) onCompanyChange();
    } catch (err: any) {
      console.error("Error setting current company:", err);
      setError(err.message || "Error setting current company");
      dispatch(setSelectedCompany(null as any));
    } finally {
      // Set loading state to false regardless of success or failure
      dispatch(setDropDownLoading(false));
    }
  };

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
              {selectedCompany?.name?.substring(0, 2).toUpperCase() || "SC"}
            </span>
            <div
              className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white
              ${
                selectedCompany?.status === CompanyStatus.ACTIVE
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            ></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 line-clamp-1">
              {selectedCompany?.name || "Select Company"}
            </span>
            <span className="text-xs text-gray-500 line-clamp-1">
              {selectedOrganization?.name}
            </span>
          </div>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-gray-500 shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-gray-200 bg-white animate-in fade-in-0 zoom-in-95 duration-100">
          {companies && companies.length > 0 ? (
            <div className="max-h-64 overflow-y-auto py-1">
              {companies.map((company) => {
                const isActive =
                  company.status === CompanyStatus.ACTIVE &&
                  !company.isMultiEntity;
                const isSelected = company.id === selectedCompany?.id;
                return (
                  <div
                    key={company.id}
                    className={`group mx-1 my-0.5 flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 hover:bg-gray-50"
                    } ${
                      !isActive
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    onClick={() => {
                      if (isActive) {
                        handleCompanySelect(selectedOrganization, company);
                      }
                    }}
                    id={`click-company-${company.id}`}
                    title={
                      !isActive
                        ? company.isMultiEntity
                          ? "Multi-entity companies cannot be selected"
                          : `This company is ${company.status}`
                        : ""
                    }
                  >
                    <div
                      className={`relative flex h-6 w-6 items-center justify-center rounded-md ${
                        isSelected
                          ? "bg-primary/20 text-primary"
                          : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-xs font-medium">
                        {company.name.substring(0, 2).toUpperCase()}
                      </span>
                      <div
                        className={`absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full border border-white ${
                          company.status === CompanyStatus.ACTIVE
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                    </div>
                    <div className="flex flex-grow items-center">
                      <span className="text-sm">{company.name}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                );
              })}
            </div>
          ) : (
            organizations.map((org) => (
              <div key={org.id}>
                <div className="p-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-gray-700">
                      {org.name}
                    </span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {org.companies &&
                    org.companies.map((company) => {
                      const isActive =
                        company.status === CompanyStatus.ACTIVE &&
                        !company.isMultiEntity;
                      const isSelected = company.id === selectedCompany?.id;
                      return (
                        <div
                          key={company.id}
                          className={`group mx-1 my-0.5 flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors ${
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "text-gray-700 hover:bg-gray-50"
                          } ${
                            !isActive
                              ? "opacity-60 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          onClick={() => {
                            if (isActive) {
                              handleCompanySelect(org, company);
                            }
                          }}
                          id={`click-company-${company.id}`}
                          title={
                            !isActive
                              ? company.isMultiEntity
                                ? "Multi-entity companies cannot be selected"
                                : `This company is ${company.status}`
                              : ""
                          }
                        >
                          <div
                            className={`relative flex h-6 w-6 items-center justify-center rounded-md ${
                              isSelected
                                ? "bg-primary/20 text-primary"
                                : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                            }`}
                          >
                            <span className="text-xs font-medium">
                              {company.name.substring(0, 2).toUpperCase()}
                            </span>
                            <div
                              className={`absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full border border-white ${
                                company.status === CompanyStatus.ACTIVE
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                          </div>
                          <div className="flex flex-grow items-center">
                            <span className="text-sm">{company.name}</span>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))
          )}
          <div className="border-t border-gray-100 p-2 flex justify-center items-center bg-gray-50">
            <Image
              onClick={() => {
                dispatch(
                  toggleComponent({ id: componentId, forceState: false })
                );
                toggleComponentState(componentId, false);
                handleAddQuickBooks();
              }}
              className="cursor-pointer"
              src={connectToQuickBooksMed || "/placeholder.svg"}
              alt="Connect to QuickBooks"
              onMouseEnter={(e) => {
                const img = e.currentTarget;
                img.src = connectToQuickBooksHoverMed.src;
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget;
                img.src = connectToQuickBooksMed.src;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const CollapsedOrganizationDropdown: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedCompany = useAppSelector(selectSelectedCompany);
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
        ) : selectedCompany ? (
          <div className="relative flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 text-white">
            <span className="text-xs text-white font-semibold">
              {selectedCompany && selectedCompany.name
                ? selectedCompany.name.substring(0, 1).toUpperCase()
                : "SC"}
            </span>
            <div
              className={`absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full border border-white
                ${
                  selectedCompany.status === CompanyStatus.ACTIVE
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
            ></div>
          </div>
        ) : (
          <Building className="h-4 w-4 text-gray-500" />
        )}
      </button>
    </div>
  );
};
