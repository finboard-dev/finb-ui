"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { setSelectedCompany } from "@/lib/store/slices/userSlice"
import { fetcher } from "@/lib/axios/config"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building, CheckCircle2, AlertCircle } from "lucide-react"
import {initAddQuickBookAccount} from "@/lib/api/intuitService";

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
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Card className="w-full max-w-md p-6">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <AlertCircle className="h-12 w-12 text-amber-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">No organization found</h2>
                            <p className="text-gray-600 mb-4">Please log in to continue.</p>
                            <Button onClick={() => router.push("/login")}>Go to Login</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const companies = selectedOrganization.companies || []

    const handleCompanySelect = (companyId: string) => {
        setSelectedCompanyId(companyId)
    }

    const handleAddQuickBooks = async () => {
        try {
            const redirectUrl = await initAddQuickBookAccount();
            if (redirectUrl) {
                window.open(redirectUrl, "_self");
            } else {
                console.error("No redirect URL provided");
            }
        } catch (error) {
            console.error(error);
        }
    };

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

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-3xl">
                <CardContent className="p-6">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Select a Company</h1>
                        <p className="text-gray-600">Choose a company from {selectedOrganization.name} to continue</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {companies.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 rounded-lg mb-6">
                            <div className="flex justify-center mb-4">
                                <Building className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies available</h3>
                            <p className="text-gray-600 mb-4">You don't have any companies in this organization.</p>
                            <Button variant="outline" onClick={handleAddQuickBooks}>
                                Add QuickBooks Company
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {companies.map((company) => (
                                <div
                                    key={company.id}
                                    className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${company.status !== "ACTIVE" ? "opacity-50 cursor-not-allowed" : ""}
                    ${selectedCompanyId === company.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}
                  `}
                                    onClick={() => company.status === "ACTIVE" && handleCompanySelect(company.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`
                      flex h-10 w-10 items-center justify-center rounded-md shrink-0
                      ${selectedCompanyId === company.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}
                    `}
                                        >
                                            <Building className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium text-gray-900">{company.name}</h3>
                                                {selectedCompanyId === company.id && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Status:{" "}
                                                <span className={company.status === "ACTIVE" ? "text-green-600" : "text-gray-500"}>
                          {company.status}
                        </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between">
                        <Button variant="outline" onClick={handleAddQuickBooks}>
                            Add New Company
                        </Button>

                        <Button
                            onClick={handleConnect}
                            disabled={!selectedCompanyId || isLoading || companies.length === 0}
                            className="min-w-[120px]"
                        >
                            {isLoading ? "Connecting..." : "Connect"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default CompanySelectionPage
