"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { setSelectedCompany } from "@/lib/store/slices/userSlice"
import { fetcher } from "@/lib/axios/config"
import { Building2, Plus, ArrowLeft } from "lucide-react"
import { initAddQuickBookAccount } from "@/lib/api/intuitService"
import connectToQuickbooksButton from "@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_tall_default.svg"
import connectToQuickBooksHover from "@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_tall_hover.svg"
import quickBooksLogo from "@/../public/images/icons/simple-icons_quickbooks.svg"

const CompanySelectionPage = () => {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const user = useAppSelector((state) => state.user.user)
    const selectedOrganization = useAppSelector((state) => state.user.selectedOrganization)
    const token = useAppSelector((state) => state.user.token)
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!token?.accessToken) {
            router.push("/login")
        }
    }, [token, router])

    if (!user || !selectedOrganization) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="w-full max-w-2xl rounded-lg border border-gray-200 p-8">
                    <div className="mb-8 flex items-center">
                        <button onClick={() => router.back()} className="mr-4">
                            <ArrowLeft className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-4 py-12">
                        <Building2 className="h-16 w-16 text-gray-400" />
                        <h2 className="text-2xl font-semibold">No organization found</h2>
                        <p className="text-gray-500">Please log in to continue</p>
                        <button
                            onClick={() => router.push("/login")}
                            className="mt-6 flex items-center justify-center rounded-md bg-[#212529] px-6 py-3 font-medium text-white hover:bg-gray-800 focus:outline-none"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const companies = selectedOrganization.companies || []

    const handleCompanySelect = (companyId: string) => {
        const selectedCompany = companies.find(company => company.id === companyId)
        if (selectedCompany && selectedCompany.status === "ACTIVE") {
            setSelectedCompanyId(companyId)
        }
    }

    const handleAddQuickBooks = async () => {
        try {
            const redirectUrl = await initAddQuickBookAccount()
            if (redirectUrl) {
                window.open(redirectUrl, "_self")
            } else {
                console.error("No redirect URL provided")
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleConnect = async () => {
        if (!selectedCompanyId) {
            setError("Please select a company to continue")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const selectedCompany = companies.find((company) => company.id === selectedCompanyId)

            if (!selectedCompany) {
                throw new Error("Selected company not found")
            }

            const response = await fetcher.post("/companies/current", {
                company_id: selectedCompanyId,
            })

            dispatch(setSelectedCompany(selectedCompany))
            document.cookie = "has_selected_company=true; path=/"

            // Redirect to dashboard
            router.push("/")
        } catch (err) {
            console.error("Error setting current company:", err)
            setError(err instanceof Error ? err.message : "Failed to connect to company")
        } finally {
            setIsLoading(false)
        }
    }

    // If no companies are available, show the NoCompaniesPage UI
    if (companies.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="w-full max-w-2xl rounded-lg border border-gray-200 p-8">
                    <div className="mb-8 flex items-center">
                        <button onClick={() => router.back()} className="mr-4">
                            <ArrowLeft className="h-5 w-5 text-gray-500" />
                        </button>
                        <div className="ml-auto rounded-md border border-gray-200 px-3 py-1.5 text-sm">
                            <span className="flex items-center gap-1.5">
                                <span className="h-4 w-4">👤</span>
                                {user.email}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-4 py-12">
                        <Building2 className="h-16 w-16 text-gray-400" />
                        <h2 className="text-2xl font-semibold">No companies available</h2>
                        <p className="text-gray-500">You don't have any companies in {selectedOrganization.name}'s organisation</p>
                        <button
                            onClick={handleAddQuickBooks}
                            disabled={isLoading}
                            className="relative w-[238px] h-[52px] group"
                        >
                            {isLoading ? (
                                <div className="h-[52px] flex items-center justify-center bg-[#4CAF50] text-white rounded-md">
                                    Loading...
                                </div>
                            ) : (
                                <>
                                    <Image
                                        src={connectToQuickbooksButton}
                                        alt="Connect to QuickBooks"
                                        className="w-full group-hover:opacity-0"
                                        priority
                                    />
                                    <Image
                                        src={connectToQuickBooksHover}
                                        alt="Connect to QuickBooks"
                                        className="w-full absolute top-0 left-0 opacity-0 group-hover:opacity-100"
                                        priority
                                    />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Main company selection UI
    return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <div className="w-full max-w-2xl rounded-lg border border-gray-200 p-8">
                <div className="mb-14 flex justify-between">
                    <div className={"space-y-4"}>
                        <h2 className="text-2xl font-semibold">Select a company</h2>
                        <p className="text-gray-500">Choose from connected company</p>
                    </div>

                    <div className=" rounded-md border max-h-fit border-gray-200 px-3 py-1.5 text-sm">
                        <span className="flex items-center gap-1.5">
                            <span className="h-4 w-4">👤</span>
                            {user.email}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {companies.map((company) => (
                        <div
                            key={company.id}
                            className={`relative flex cursor-pointer items-center gap-3 rounded-md border ${
                                company.status !== "ACTIVE" ? "opacity-50 cursor-not-allowed" : ""
                            } ${
                                selectedCompanyId === company.id
                                    ? "border-[#4CAF50] ring-1 ring-[#4CAF50]"
                                    : "border-gray-200 hover:border-gray-300"
                            } p-4`}
                            onClick={() => handleCompanySelect(company.id)}
                        >
                            <Building2 className="h-6 w-6 text-gray-400" />
                            <div>
                                <p className="font-medium">{company.name}</p>
                                <p className={`text-sm ${company.status === "ACTIVE" ? "text-[#4CAF50]" : "text-red-500"}`}>
                                    {company.status}
                                </p>
                            </div>
                            {selectedCompanyId === company.id && (
                                <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-[#4CAF50]"></div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4">
                    <button
                        onClick={handleAddQuickBooks}
                        className="flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-[#4CAF50] hover:bg-gray-50"
                    >
                        <Image src={quickBooksLogo} alt={""}/>
                        Add new company
                    </button>

                    <button
                        onClick={handleConnect}
                        disabled={!selectedCompanyId || isLoading}
                        className={`rounded-md ${
                            selectedCompanyId && !isLoading ? "bg-[#212529]" : "bg-gray-200"
                        } px-6 py-2 text-sm font-medium text-white`}
                    >
                        {isLoading ? "Connecting..." : "Connect"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CompanySelectionPage