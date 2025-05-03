import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface Tool {
    id: string
    name: string
    description: string
    category: string
}

interface Chat {
    id: string
    name: string
}

interface CompanyRole {
    id: string
    name: string
    permissions: string[]
}

interface CurrentCompany {
    id: string
    name: string
    status: string
    tools: Tool[]
    chats: Chat[]
    role: CompanyRole
}

interface CompanyState {
    currentCompany: CurrentCompany | null
    isLoading: boolean
    error: string | null
}

const initialState: CompanyState = {
    currentCompany: null,
    isLoading: false,
    error: null,
}

const companySlice = createSlice({
    name: "company",
    initialState,
    reducers: {
        setCurrentCompany: (state, action: PayloadAction<CurrentCompany>) => {
            state.currentCompany = action.payload
            state.error = null
        },
        setCompanyLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload
        },
        setCompanyError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload
        },
        clearCompanyData: (state) => {
            state.currentCompany = null
            state.isLoading = false
            state.error = null
        },
    },
})

export const { setCurrentCompany, setCompanyLoading, setCompanyError, clearCompanyData } = companySlice.actions

export const selectCurrentCompany = (state: { company: CompanyState }) => state.company.currentCompany

export const selectCompanyTools = (state: { company: CompanyState }) => state.company.currentCompany?.tools || []

export const selectCompanyChats = (state: { company: CompanyState }) => state.company.currentCompany?.chats || []

export default companySlice.reducer
