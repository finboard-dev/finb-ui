import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Tool, Assistant, CompanyRole, ChatConversation } from "@/types/chat"

interface CurrentCompany {
    id: string
    name: string
    status: string
    assistants: Assistant[] | null | undefined;
    role: CompanyRole
    chatConversations: ChatConversation[]
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
        setCurrentCompany: (state, action: PayloadAction<CurrentCompany | null>) => { // Allow null payload to clear company
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

export const selectAllCompanyAssistants = (state : {company : CompanyState}) => state?.company?.currentCompany?.assistants || [];

// Selector to get all tools from all assistants (for mentions)
export const selectAllCompanyTools = (state: { company: CompanyState }): Tool[] => {
    const assistants = state?.company?.currentCompany?.assistants || [];

    if (!Array.isArray(assistants)) {
        return [];
    }

    return assistants.reduce((acc: Tool[], assistant: Assistant) => {
        const tools = assistant?.tools || [];
        if (!Array.isArray(tools)) {
            return acc;
        }
        return acc.concat(tools);
    }, []);
};


export const selectCompanyChatConversations = (state: { company: CompanyState }) => state.company.currentCompany?.chatConversations || []

export default companySlice.reducer