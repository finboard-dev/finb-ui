import { fetcher } from "@/lib/axios/config"
import { store } from "@/lib/store/store"
import { setCurrentCompany } from "@/lib/store/slices/companySlice"

export interface CompanyResponse {
    id: string
    name: string
    status: string
    tools: Array<{
        id: string
        name: string
        description: string
        category: string
    }>
    chats: any[]
    role: {
        id: string
        name: string
        permissions: string[]
    }
}

class CompanyService {
    async setCurrentCompany(companyId: string): Promise<CompanyResponse> {
        try {
            const response = await fetcher.post("/companies/current", {
                company_id: companyId,
            })

            store.dispatch(setCurrentCompany(response))

            if (typeof document !== "undefined") {
                document.cookie = "has_selected_company=true; path=/"
            }

            return response
        } catch (error) {
            console.error("Error setting current company:", error)
            throw error
        }
    }

    async getCurrentCompanyData(): Promise<CompanyResponse> {
        try {
            const response = await fetcher.get("/companies/current")

            store.dispatch(setCurrentCompany(response))

            return response
        } catch (error) {
            console.error("Error getting current company data:", error)
            throw error
        }
    }
}

export const companyService = new CompanyService()
