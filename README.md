# finb.ai - Financial Intelligence Platform

## Developer Documentation

### Project Overview

This is a modern financial intelligence platform built with Next.js and React, featuring a robust QuickBooks integration for real-time financial data access. The application provides AI-powered financial analytics with a clean, modern UI.

### Tech Stack

- **Frontend Framework**: Next.js 15.2.4 with App Router
- **UI Library**: React 19.0.0
- **State Management**: Redux Toolkit with react-redux 9.2.0
- **Styling**: TailwindCSS with custom animations
- **UI Components**: Radix UI, Mantine, Headless UI
- **Visualization**: D3.js, Vega-Lite, Recharts
- **Authentication**: OAuth 2.0 (QuickBooks)
- **Code Editor**: Monaco Editor
- **Animation**: Framer Motion

### Setup and Development

1. **Installation**
   ```bash
   git clone git@github.com:finboard-dev/finb-ui.git
   cd finb-ui
   yarn install
   ```

2. **Environment Configuration**
   Create a `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=your_api_url
   NEXT_PUBLIC_QB_CLIENT_ID=your_quickbooks_client_id
   NEXT_PUBLIC_QB_REDIRECT_URI=http://localhost:3000/oauth2redirect/quickbooks
   ```

3. **Running the Development Server**
   ```bash
   yarn dev
   ```

4. **Production Build**
   ```bash
   yarn build
   yarn start
   ```


### Key Directories and Files

#### `/app` (Next.js App Router)
Contains all the page components organized by routes. Each folder represents a route segment.

#### `/components`
Organized into three categories:
- **UI**: Reusable base UI components following atomic design principles
- **Features**: Feature-specific components that combine UI components
- **Layout**: Components that manage the application layout

#### `/lib`
Contains all non-component code:
- **API**: Services for communicating with backend
- **Auth**: Authentication utilities
- **Store**: Redux store configuration and slices
- **Utils**: Helper functions and utilities
- **Hooks**: Custom React hooks

#### `/types`
TypeScript type definitions, organized by domain

#### Configuration Files
- **next.config.js**: Next.js configuration
- **tailwind.config.js**: Tailwind CSS configuration
- **tsconfig.json**: TypeScript configuration
- **.env.local**: Local environment variables

### Core Authentication Flow

1. **QuickBooks OAuth2.0 Integration**
    - User clicks "Sign in with QuickBooks" on the login page
    - Browser redirects to QuickBooks authorization page
    - User authorizes the application
    - QuickBooks redirects back to `/oauth2redirect/quickbooks` with an auth code
    - Auth code is exchanged for access tokens
    - User data is stored in Redux state

2. **Known Issues and Solutions**

    - **Redux state initialization issue**: When setting user data in Redux, ensure state is properly initialized:
      ```typescript
      // FIX: Check if state is null before setting properties
      if (state === null) {
        console.error("State is null in reducer");
        return initialState;
      }
      ```

    - **Token storage error**: The error "Cannot set properties of null (setting 'token')" indicates a Redux state issue. Make sure:
        - Redux store is properly initialized
        - Initial state has the correct structure
        - Redux Provider properly wraps your application
        - Redux slices are correctly exported and imported

### Data Flow Architecture

1. **Authentication**
    - `intuitService.ts` -> `quickbooks.ts` -> Redux store (`userSlice.ts`)

2. **Session Management**
    - Token stored in Redux
    - User data persisted in Redux
    - Company/Organization selection stored in Redux

### Core Redux Structure

- **userSlice**: Manages user profile, auth tokens, and selected organization/company
- **authSlice**: Manages application-level auth state
- **uiSlice**: Manages UI state like sidebar visibility
- **chatSlice**: Manages chat interface state

### Development Guidelines

1. **State Management**
    - Use Redux for global application state
    - Use local state for component-specific UI state
    - Always handle loading and error states

2. **API Calls**
    - Use dedicated service modules for API integration
    - Handle errors properly with try/catch
    - Provide meaningful error messages

3. **Type Safety**
    - Use TypeScript interfaces for all data structures
    - Define explicit return types for functions
    - Use type guards for conditional logic

4. **Component Design**
    - Keep components focused on a single responsibility
    - Use composition over inheritance
    - Implement proper loading and error states

### Troubleshooting

1. **Redux State Issues**
    - Check Redux DevTools for current state
    - Verify action payloads before dispatching
    - Ensure reducers properly handle edge cases
    - Verify store is properly configured

2. **Authentication Issues**
    - Check browser console for API errors
    - Verify OAuth redirect URIs match configuration
    - Check token expiration and refresh logic

3. **Rendering Problems**
    - Check for null/undefined values in props
    - Verify component rendering conditions
    - Inspect component hierarchy in React DevTools

### API Services

1. **QuickBooks Integration**
    - `intuitSSOLogin()`: Initiates OAuth flow
    - `quickbooksService.ssoLogin()`: Handles OAuth callback
    - Token management in Redux store

2. **Data Fetching**
    - Implement proper loading states
    - Handle errors gracefully
    - Use typescript for response types

### Commands

- `yarn dev`: Start development server
- `yarn build`: Build production app
- `yarn start`: Run production server
- `yarn lint`: Run ESLint
- `yarn type-check`: Run TypeScript check

### Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [QuickBooks API](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

---

© 2025 finb.ai - For developer use