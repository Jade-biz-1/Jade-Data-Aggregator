# Frontend UI/Code Review

This document outlines the findings of a comprehensive review of the frontend codebase. The review focused on completeness, adherence to standard web UI practices, pending tasks, placeholders, and unimplemented features.

## 1. High-Level Summary

The frontend is a modern and well-structured Next.js application. It leverages a robust technology stack including:

-   **Framework:** Next.js with the App Router
-   **Styling:** Tailwind CSS with Shadcn/UI components
-   **State Management:** Zustand
-   **API Communication:** Axios (via a wrapper)
-   **Core UI:** React Flow for the pipeline builder

The application is feature-rich, with a sophisticated Role-Based Access Control (RBAC) system and a comprehensive set of tools for data management. However, a critical security vulnerability exists, and several features are either incomplete or contain placeholder data.

## 2. Critical Security Vulnerability

**Location:** `frontend/src/middleware.ts`

A major security flaw was identified in the Next.js middleware. The `getUserRoleFromToken` function decodes the JWT to extract user roles **without performing cryptographic signature verification**.

```typescript
// Example from middleware.ts
const decoded = jwt.decode(token) as { [key: string]: any; roles: any };
```

This means that a malicious actor could forge a JWT with elevated privileges (e.g., `admin`), and the frontend would accept it, granting access to protected routes. While the backend should always validate the token on every API request, relying on this is not secure. The middleware itself must validate the token signature to be considered secure.

**Recommendation:** Implement JWT signature verification in the middleware using a library like `jose` or `jsonwebtoken` and the public key or secret.

## 3. Incomplete Features & Placeholders

Several parts of the application are not fully implemented or rely on placeholder/mocked data.

### 3.1. Transformations Page

**Location:** `frontend/src/app/transformations/page.tsx`

-   **Edit Functionality:** The "Edit" button for transformations is not functional. The `handleEditTransformation` function displays a toast message: `"Edit functionality coming soon"`.
-   **Placeholder Metrics:** The UI displays "Records Processed" and per-transformation record counts, but the values are hardcoded to `0`. The code contains comments like `_/* Replace with actual records processed when available */_` and `_/* Last run date when available */_`, indicating the data is not being fetched from the backend.

### 3.2. Schema Mapping Page

**Location:** `frontend/src/app/schema/mapping/page.tsx`

-   **Mocked Validation & Code Generation:** The "Validate Mapping" and "Generate Code" functionalities are currently client-side mocks.
    -   The `handleValidate` function performs a basic check for unmapped fields but includes the comment: `// In a real implementation, this would call the validation endpoint`.
    -   The `handleGenerateCode` function is commented with `// Mock code generation` and generates code strings entirely on the client.
-   **Generated `TODO`s:** The Python code generation intentionally creates `_# TODO: ..._` comments for any non-direct field mappings. This is a design choice to guide the user but confirms that the generated code is not a complete, out-of-the-box solution.

### 3.3. Dashboard Page

**Location:** `frontend/src/app/dashboard/page.tsx`

-   **Hardcoded Statistics:** The statistics cards at the top of the dashboard display hardcoded percentage changes (e.g., `change="+12%"`). This data should be fetched from the backend or calculated dynamically.

## 4. UI & Code Best Practices

### Areas for Improvement

-   **API URL Management:** Some older components (e.g., `SchemaMappingPage`) construct the API URL manually (`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'`) and fetch directly, bypassing the central `apiClient`. All API calls should be consolidated into the `apiClient` for consistency and easier management.

### What's Done Well

-   **Component-Based Architecture:** The project makes excellent use of reusable components, particularly the UI components in `frontend/src/components/ui/`.
-   **State Management:** The application effectively uses loading, saving, and error states, providing clear feedback to the user via spinners, disabled buttons, and toasts.
-   **Core Feature Completeness:** The `pipeline-builder` is a complex and feature-rich component that is well-implemented and appears to be fully functional.
-   **RBAC Foundation:** A solid foundation for Role-Based Access Control is in place via middleware and the `usePermissions` hook. Once the security flaw is fixed, this will be a strong feature.
-   **Good UX in Forms:** Input fields across the application make good use of `placeholder` text to guide users.

## 5. Summary of Pending Tasks

-   **High Priority:** Fix JWT signature verification in `middleware.ts`.
-   Implement "Edit" functionality for transformations.
-   Integrate backend data for transformation metrics (records processed, last run date).
-   Replace mocked validation and code generation on the schema mapping page with real backend API calls.
-   Fetch or calculate dynamic percentage changes for the dashboard statistics.
-   Refactor API calls in older components to use the centralized `apiClient`.
