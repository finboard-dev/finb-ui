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
import {clearAllChats, clearMessages, toggleSidebar} from "@/lib/store/slices/chatSlice";
import { initAddQuickBookAccount } from "@/lib/api/intuitService";
import { fetcher } from "@/lib/axios/config";
import { selectDropDownLoading, setDropDownLoading } from "@/lib/store/slices/loadingSlice";
import { setCurrentCompany, setCompanyLoading, setCompanyError } from "@/lib/store/slices/companySlice";
import connectToQuickBooksMed from "@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_med_default.svg"
import connectToQuickBooksHoverMed from "@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_med_hover.svg"
import Image from "next/image";

// Define the props interface for OrganizationDropdown
interface OrganizationDropdownProps {
  onCompanyChange?: () => void; // Optional callback for when company changes
}

export const OrganizationDropdown: React.FC<OrganizationDropdownProps> = ({ onCompanyChange }) => {
  const [error, setError] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const componentId = "dropdown-organization";

  const user = useSelector(selectUser);
  const selectedOrganization = useSelector(selectSelectedOrganization);
  const selectedCompany = useSelector(selectSelectedCompany);
  const isLoading = useAppSelector(selectDropDownLoading);

  useEffect(() => {
    const isOpenFromUrl = searchParams.get(componentId) === "open";
    dispatch(
        initializeComponent({
          type: "dropdown",
          id: componentId,
          isOpenFromUrl,
        })
    );
  }, [dispatch, searchParams]);

  const isOpen = useAppSelector((state) => selectIsComponentOpen(state, componentId));

  const updateUrlParams = (isOpen: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (isOpen) {
      params.set(componentId, "open");
    } else {
      params.delete(componentId);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleToggle = () => {
    const newState = !isOpen;
    dispatch(toggleComponent({ id: componentId, forceState: newState }));
    updateUrlParams(newState);
  };

  const handleAddQuickBooks = async () => {
    try {
      const redirectUrl = await initAddQuickBookAccount();
      if (redirectUrl) {
        window.open(redirectUrl, "_blank");
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


  const handleCompanySelect = async (company: Company) => {
    dispatch(setDropDownLoading(true));
    dispatch(setCompanyLoading(true));
    setError(null);
    dispatch(clearAllChats());

    try {
      dispatch(setSelectedCompany(company));
      const response = await fetcher.post("/companies/current", {
        company_id: company?.id,
      });
      dispatch(setCurrentCompany(response));

      document.cookie = "has_selected_company=true; path=/";

      dispatch(toggleComponent({ id: componentId, forceState: false }));
      updateUrlParams(false);

      if (onCompanyChange) {
        onCompanyChange();
      }
    } catch (err: any) {
      console.error("Error setting current company:", err);
      setError("Failed to connect company");
      dispatch(setCompanyError(err.message || "Failed to connect company"));
      dispatch(setSelectedCompany(null as any));
    } finally {
      dispatch(setDropDownLoading(false));
      dispatch(setCompanyLoading(false));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        dispatch(toggleComponent({ id: componentId, forceState: false }));
        updateUrlParams(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dispatch, searchParams, router]);

  if (!selectedOrganization || !user) return null;
  const organizations = user.organizations || (selectedOrganization ? [selectedOrganization] : []);

  return (
      <div className="relative w-full" ref={dropdownRef}>
        <button
            type="button"
            className="flex w-full hover:cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left shadow-sm hover:bg-gray-50 focus:outline-none transition-all duration-200"
            onClick={handleToggle}
            id="dropdown-organization-button"
            disabled={isLoading}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-primary to-primary/80 text-white shadow-inner">
            <span className="text-xs font-semibold">
              {selectedCompany?.name.substring(0, 2).toUpperCase() || "SC"}
            </span>
              <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-white"></div>
            </div>
            <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 line-clamp-1">
              {selectedCompany?.name || "Select Company"}
            </span>
              <span className="text-xs text-gray-500 line-clamp-1">{selectedOrganization.name}</span>
            </div>
          </div>
          {isLoading ? (
              <Loader2 className="h-4 w-4 text-gray-500 shrink-0 ml-1.5 animate-spin" />
          ) : (
              <ChevronsUpDown className="h-4 w-4 text-gray-500 shrink-0 ml-1.5" />
          )}
        </button>

        {isOpen && (
            <div className="absolute top-full left-0 z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-gray-200 bg-white animate-in fade-in-0 zoom-in-95 duration-100">
              {organizations.map((org) => (
                  <div key={org.id}>
                    <div className="p-2.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium text-gray-700">{org.name}</span>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1">
                      {org.companies &&
                          org.companies.map((company) => (
                              <div
                                  key={company.id}
                                  className={`group mx-1 my-0.5 flex items-center gap-3 rounded-md px-2.5 py-2 cursor-pointer transition-colors ${
                                      company.id === selectedCompany?.id
                                          ? "bg-primary/10 text-primary"
                                          : "text-gray-700 hover:bg-gray-50"
                                  } ${isLoading && company.id === selectedCompany?.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                  onClick={() => {
                                    if (!isLoading) {
                                      handleOrganizationSelect(org);
                                      handleCompanySelect(company);
                                    }
                                  }}
                                  id={`click-company-${company.id}`}
                              >
                                <div
                                    className={`flex h-6 w-6 items-center justify-center rounded-md 
                        ${
                                        company.id === selectedCompany?.id
                                            ? "bg-primary/20 text-primary"
                                            : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                                    }`}
                                >
                        <span className="text-xs font-medium">
                          {company.name.substring(0, 2).toUpperCase()}
                        </span>
                                </div>
                                <span className="flex-grow text-sm">{company.name}</span>
                                {company.id === selectedCompany?.id && (
                                    isLoading ? (
                                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4 text-primary" />
                                    )
                                )}
                              </div>
                          ))}
                    </div>
                  </div>
              ))}

              <div className="border-t border-gray-100 p-2 flex justify-center items-center bg-gray-50">
                  <Image
                      onClick={() => {
                        dispatch(toggleComponent({ id: componentId, forceState: false }));
                        updateUrlParams(false);
                        handleAddQuickBooks();
                      }}
                      className={`${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      src={connectToQuickBooksMed || "/placeholder.svg"}
                      alt="Connect to QuickBooks"
                      onMouseEnter={(e) => {
                        const img = e.currentTarget
                        img.src = connectToQuickBooksHoverMed.src
                      }}
                      onMouseLeave={(e) => {
                        const img = e.currentTarget
                        img.src = connectToQuickBooksMed.src
                      }}
                  />
              </div>

              {error && (
                  <div className="p-2 bg-red-50 border-t border-red-100">
                    <div className="text-xs text-red-600">{error}</div>
                  </div>
              )}
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
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 text-white">
            <span className="text-xs text-white font-semibold">
              {selectedCompany.name.substring(0, 1).toUpperCase()}
            </span>
              </div>
          ) : (
              <Building className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </div>
  );
};