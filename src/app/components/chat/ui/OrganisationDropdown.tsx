import React, { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronsUpDown, Building, Users, Check } from "lucide-react";
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
import { toggleSidebar } from "@/lib/store/slices/chatSlice";
import { initAddQuickBookAccount } from "@/lib/api/intuitService";

export const OrganizationDropdown: React.FC = () => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const componentId = "dropdown-organization";

  const user = useSelector(selectUser);
  const selectedOrganization = useSelector(selectSelectedOrganization);
  const selectedCompany = useSelector(selectSelectedCompany);

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

  const isOpen = useAppSelector((state) =>
    selectIsComponentOpen(state, componentId)
  );

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
    } finally {
    }
  };

  const handleOrganizationSelect = (organization: Organization) => {
    dispatch(setSelectedOrganization(organization));
  };

  const handleCompanySelect = (company: Company) => {
    dispatch(setSelectedCompany(company));
    dispatch(toggleComponent({ id: componentId, forceState: false }));
    updateUrlParams(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
              {selectedCompany?.name.substring(0, 2).toUpperCase() || "SC"}
            </span>
            <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-white"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 line-clamp-1">
              {selectedCompany?.name || "Select Company"}
            </span>
            <span className="text-xs text-gray-500 line-clamp-1">
              {selectedOrganization.name}
            </span>
          </div>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-gray-500 shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-gray-200 bg-white animate-in fade-in-0 zoom-in-95 duration-100">
          {user.organizations.map((org) => (
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
                {org.companies.map((company) => (
                  <div
                    key={company.id}
                    className={`group mx-1 my-0.5 flex items-center gap-3 rounded-md px-2.5 py-2 cursor-pointer transition-colors ${
                      company.id === selectedCompany?.id
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      handleOrganizationSelect(org);
                      handleCompanySelect(company);
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
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="border-t border-gray-100 p-2 bg-gray-50">
            <button
              id="new-company-button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
              onClick={() => {
                dispatch(
                  toggleComponent({ id: componentId, forceState: false })
                );
                updateUrlParams(false);
                handleAddQuickBooks();
              }}
            >
              <Building className="h-3.5 w-3.5" />
              <span>New Company</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const CollapsedOrganizationDropdown: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedCompany = useAppSelector(selectSelectedCompany);

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
      >
        {selectedCompany ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 text-white">
            <span className="text-xs text-primary font-semibold">
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
