import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type UIComponentType = 'dropdown' | 'modal' | 'sidebar' | 'filter' | 'panel';

interface UIComponentState {
  id: string;
  type: UIComponentType;
  isOpen: boolean;
  params?: Record<string, any>;
}

interface UIState {
  components: Record<string, UIComponentState>;
  mainContent: "chat" | "settings";
  activeSettingsSection: "data-connections" | "profile" | "security" | "logout" | 'users-roles';
  isSidebarCollapsed: boolean;
}

const initialState: UIState = {
  components: {},
  mainContent: "chat",
  activeSettingsSection: "data-connections", // Default to data-connections
  isSidebarCollapsed: false,
};

const generateComponentId = (type: UIComponentType, identifier?: string): string => {
  return `${type}-${identifier || Date.now()}`;
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    initializeComponent: (
        state,
        action: PayloadAction<{
          type: UIComponentType;
          id?: string;
          initialParams?: Record<string, any>;
          isOpenFromUrl?: boolean;
        }>
    ) => {
      const { type, id, initialParams, isOpenFromUrl } = action.payload;
      const componentId = id || generateComponentId(type);

      if (!state.components[componentId]) {
        state.components[componentId] = {
          id: componentId,
          type,
          isOpen: isOpenFromUrl || false,
          params: initialParams || {},
        };
      } else if (isOpenFromUrl !== undefined) {
        // Update existing component's isOpen state if isOpenFromUrl is provided
        state.components[componentId].isOpen = isOpenFromUrl;
      }
    },

    toggleComponent: (
        state,
        action: PayloadAction<{
          id: string;
          forceState?: boolean;
        }>
    ) => {
      const { id, forceState } = action.payload;
      const component = state.components[id];
      if (component) {
        const newState = forceState !== undefined ? forceState : !component.isOpen;
        component.isOpen = newState;
        
        // Sync sidebar collapse state when sidebar-chat component is toggled
        if (id === "sidebar-chat") {
          state.isSidebarCollapsed = !newState; // Invert because isOpen=true means not collapsed
        }
      }
    },

    updateComponentParams: (
        state,
        action: PayloadAction<{
          id: string;
          params: Record<string, any>;
        }>
    ) => {
      const { id, params } = action.payload;
      const component = state.components[id];
      if (component) {
        component.params = {
          ...component.params,
          ...params,
        };
      }
    },

    removeComponent: (state, action: PayloadAction<string>) => {
      delete state.components[action.payload];
    },

    resetComponents: (state) => {
      state.components = {};
    },

    setMainContent: (state, action: PayloadAction<"chat" | "settings">) => {
      state.mainContent = action.payload;
    },

    setActiveSettingsSection: (
        state,
        action: PayloadAction<"data-connections" | "profile" | "security" | "logout" | 'users-roles'>
    ) => {
      state.activeSettingsSection = action.payload;
    },

    toggleSidebarCollapse: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },

    setSidebarCollapse: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },
  },
});

export const {
  initializeComponent,
  toggleComponent,
  updateComponentParams,
  removeComponent,
  resetComponents,
  setMainContent,
  setActiveSettingsSection,
  toggleSidebarCollapse,
  setSidebarCollapse,
} = uiSlice.actions;

export const selectComponentState = (state: { ui: UIState }, id: string) =>
    state.ui.components[id];

export const selectIsComponentOpen = (state: { ui: UIState }, id: string) =>
    state.ui.components[id]?.isOpen || false;

export const selectComponentParams = (state: { ui: UIState }, id: string) =>
    state.ui.components[id]?.params || {};

export const selectMainContent = (state: { ui: UIState }) => state.ui.mainContent;

export const selectActiveSettingsSection = (state: { ui: UIState }) => state.ui.activeSettingsSection;

export const selectIsSidebarCollapsed = (state: { ui: UIState }) => state.ui.isSidebarCollapsed;

export default uiSlice.reducer;