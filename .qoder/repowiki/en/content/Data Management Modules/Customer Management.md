# Customer Management

<cite>
**Referenced Files in This Document**
- [page.tsx](file://src/app/(private)/customers/page.tsx)
- [route.ts](file://src/app/api/customers/route.ts)
- [data-table.tsx](file://src/modules/customers/components/data-table.tsx)
- [columns.tsx](file://src/modules/customers/components/columns.tsx)
- [add-customer-modal.tsx](file://src/modules/customers/components/add-customer-modal.tsx)
- [data-table-toolbar.tsx](file://src/modules/customers/components/data-table-toolbar.tsx)
- [data-table-pagination.tsx](file://src/modules/customers/components/data-table-pagination.tsx)
- [data-table-row-actions.tsx](file://src/modules/customers/components/data-table-row-actions.tsx)
- [data-table-column-header.tsx](file://src/modules/customers/components/data-table-column-header.tsx)
- [data-table-view-options.tsx](file://src/modules/customers/components/data-table-view-options.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [customer-mock-data.ts](file://src/modules/customers/services/customer-mock-data.ts)
- [customer-types.ts](file://src/modules/customers/services/types/customer-types.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains the Customer Management module, focusing on the data model, CRUD operations, search and filtering, bulk actions, and the data table implementation with sorting, pagination, and column customization. It also covers the add customer modal, form validation, error handling, service layer architecture, mock data patterns for development, and guidance for extending fields, implementing custom actions, and integrating external APIs.

## Project Structure
The Customer Management feature is organized under a dedicated module with clear separation between UI components, services, types, and API routes:
- Page entry point renders the main customers view.
- A Next.js API route exposes endpoints for customer data.
- The data table and related UI components implement display, filtering, sorting, pagination, and row actions.
- Services encapsulate business logic and data access, using mock data during development.
- Types define the customer schema and request/response contracts.

```mermaid
graph TB
subgraph "App Layer"
P["Page<br/>src/app/(private)/customers/page.tsx"]
API["API Route<br/>src/app/api/customers/route.ts"]
end
subgraph "UI Components"
DT["Data Table<br/>components/data-table.tsx"]
COLS["Columns<br/>components/columns.tsx"]
TOOLBAR["Toolbar<br/>components/data-table-toolbar.tsx"]
PAG["Pagination<br/>components/data-table-pagination.tsx"]
ROWACT["Row Actions<br/>components/data-table-row-actions.tsx"]
HDR["Column Header<br/>components/data-table-column-header.tsx"]
VIEWOPT["View Options<br/>components/data-table-view-options.tsx"]
ADDMOD["Add Modal<br/>components/add-customer-modal.tsx"]
end
subgraph "Services"
SVC["Customer Services<br/>services/customer-services.ts"]
MOCK["Mock Data<br/>services/customer-mock-data.ts"]
TYPES["Types<br/>services/types/customer-types.ts"]
end
P --> DT
DT --> COLS
DT --> TOOLBAR
DT --> PAG
DT --> ROWACT
DT --> HDR
DT --> VIEWOPT
DT --> ADDMOD
DT --> SVC
SVC --> MOCK
SVC --> TYPES
API --> SVC
```

**Diagram sources**
- [page.tsx](file://src/app/(private)/customers/page.tsx)
- [route.ts](file://src/app/api/customers/route.ts)
- [data-table.tsx](file://src/modules/customers/components/data-table.tsx)
- [columns.tsx](file://src/modules/customers/components/columns.tsx)
- [data-table-toolbar.tsx](file://src/modules/customers/components/data-table-toolbar.tsx)
- [data-table-pagination.tsx](file://src/modules/customers/components/data-table-pagination.tsx)
- [data-table-row-actions.tsx](file://src/modules/customers/components/data-table-row-actions.tsx)
- [data-table-column-header.tsx](file://src/modules/customers/components/data-table-column-header.tsx)
- [data-table-view-options.tsx](file://src/modules/customers/components/data-table-view-options.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [customer-mock-data.ts](file://src/modules/customers/services/customer-mock-data.ts)
- [customer-types.ts](file://src/modules/customers/services/types/customer-types.ts)

**Section sources**
- [page.tsx](file://src/app/(private)/customers/page.tsx)
- [route.ts](file://src/app/api/customers/route.ts)
- [data-table.tsx](file://src/modules/customers/components/data-table.tsx)
- [columns.tsx](file://src/modules/customers/components/columns.tsx)
- [data-table-toolbar.tsx](file://src/modules/customers/components/data-table-toolbar.tsx)
- [data-table-pagination.tsx](file://src/modules/customers/components/data-table-pagination.tsx)
- [data-table-row-actions.tsx](file://src/modules/customers/components/data-table-row-actions.tsx)
- [data-table-column-header.tsx](file://src/modules/customers/components/data-table-column-header.tsx)
- [data-table-view-options.tsx](file://src/modules/customers/components/data-table-view-options.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [customer-mock-data.ts](file://src/modules/customers/services/customer-mock-data.ts)
- [customer-types.ts](file://src/modules/customers/services/types/customer-types.ts)

## Core Components
- Data Table: Central component that manages state for rows, columns, sorting, filtering, pagination, and selection. It composes toolbar, pagination, row actions, and column headers.
- Columns Definition: Declares which fields are displayed, their labels, sortability, and filters.
- Toolbar: Provides global search input and faceted filters to narrow down results.
- Pagination: Controls page size and current page, and updates the table accordingly.
- Row Actions: Offers per-row actions such as edit or delete.
- Add Customer Modal: Dialog for creating new customers with form controls and validation.
- Service Layer: Encapsulates data fetching and mutations; currently uses mock data for development.
- Types: Strongly typed definitions for customer entities and API payloads.

Key responsibilities:
- State orchestration in the data table (sorting, filtering, pagination, selection).
- Declarative column configuration for rendering and behavior.
- Isolated service calls for CRUD operations.
- Validation and user feedback in the add modal.

**Section sources**
- [data-table.tsx](file://src/modules/customers/components/data-table.tsx)
- [columns.tsx](file://src/modules/customers/components/columns.tsx)
- [data-table-toolbar.tsx](file://src/modules/customers/components/data-table-toolbar.tsx)
- [data-table-pagination.tsx](file://src/modules/customers/components/data-table-pagination.tsx)
- [data-table-row-actions.tsx](file://src/modules/customers/components/data-table-row-actions.tsx)
- [add-customer-modal.tsx](file://src/modules/customers/components/add-customer-modal.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [customer-types.ts](file://src/modules/customers/services/types/customer-types.ts)

## Architecture Overview
The module follows a layered approach:
- Presentation Layer: Page and reusable UI components render the interface and handle user interactions.
- Service Layer: Business logic and data access are abstracted behind functions that can be swapped between mock and real implementations.
- API Layer: Next.js API route handles HTTP requests and delegates to the service layer.

```mermaid
sequenceDiagram
participant U as "User"
participant P as "Page"
participant DT as "Data Table"
participant S as "Customer Services"
participant M as "Mock Data"
participant R as "API Route"
U->>P : Open Customers
P->>DT : Render table with columns and initial state
DT->>S : Fetch customers (list/search/filter/paginate)
alt Development
S->>M : Read mock data
M-->>S : Return dataset
else Production
S->>R : Call /api/customers
R-->>S : JSON response
end
S-->>DT : Processed data
DT-->>U : Display table with sorting, filters, pagination
```

**Diagram sources**
- [page.tsx](file://src/app/(private)/customers/page.tsx)
- [data-table.tsx](file://src/modules/customers/components/data-table.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [customer-mock-data.ts](file://src/modules/customers/services/customer-mock-data.ts)
- [route.ts](file://src/app/api/customers/route.ts)

## Detailed Component Analysis

### Data Model and Types
- Customer entity type defines the shape of a customer record used across the UI and services.
- Request/response types define payloads for create/update operations and list queries.
- Extensibility: To add a field, update the type definition and propagate changes to columns and forms.

```mermaid
classDiagram
class Customer {
+string id
+string name
+string email
+string phone
+string status
+datetime createdAt
+datetime updatedAt
}
class CreateCustomerRequest {
+string name
+string email
+string phone
+string status
}
class UpdateCustomerRequest {
+string id
+string name
+string email
+string phone
+string status
}
class ListCustomersQuery {
+string search
+object filters
+number page
+number pageSize
+string sortBy
+string sortOrder
}
Customer <.. CreateCustomerRequest : "creates"
Customer <.. UpdateCustomerRequest : "updates"
ListCustomersQuery --> Customer : "returns subset"
```

**Diagram sources**
- [customer-types.ts](file://src/modules/customers/services/types/customer-types.ts)

**Section sources**
- [customer-types.ts](file://src/modules/customers/services/types/customer-types.ts)

### Data Table Implementation
Responsibilities:
- Sorting: Column header click toggles ascending/descending order.
- Filtering: Global text search and faceted filters applied via the toolbar.
- Pagination: Controlled by the pagination component; supports changing page size and navigating pages.
- Column Customization: View options allow toggling visibility of columns.
- Selection: Checkbox selection enables bulk actions.

```mermaid
flowchart TD
Start(["Render Table"]) --> Load["Load Data from Service"]
Load --> ApplyFilters["Apply Search and Faceted Filters"]
ApplyFilters --> ApplySort["Apply Sort Order"]
ApplySort --> Slice["Slice for Current Page"]
Slice --> Render["Render Rows and Headers"]
Render --> UserSort{"User Clicks Column Header?"}
UserSort --> |Yes| ApplySort
UserSort --> |No| UserFilter{"User Changes Filter/Search?"}
UserFilter --> |Yes| ApplyFilters
UserFilter --> |No| UserPag{"User Changes Page/Size?"}
UserPag --> |Yes| Slice
UserPag --> |No| End(["Idle"])
```

**Diagram sources**
- [data-table.tsx](file://src/modules/customers/components/data-table.tsx)
- [data-table-toolbar.tsx](file://src/modules/customers/components/data-table-toolbar.tsx)
- [data-table-pagination.tsx](file://src/modules/customers/components/data-table-pagination.tsx)
- [data-table-column-header.tsx](file://src/modules/customers/components/data-table-column-header.tsx)
- [data-table-view-options.tsx](file://src/modules/customers/components/data-table-view-options.tsx)

**Section sources**
- [data-table.tsx](file://src/modules/customers/components/data-table.tsx)
- [data-table-toolbar.tsx](file://src/modules/customers/components/data-table-toolbar.tsx)
- [data-table-pagination.tsx](file://src/modules/customers/components/data-table-pagination.tsx)
- [data-table-column-header.tsx](file://src/modules/customers/components/data-table-column-header.tsx)
- [data-table-view-options.tsx](file://src/modules/customers/components/data-table-view-options.tsx)

### Columns Configuration
- Defines visible columns, labels, sort flags, and filter configurations.
- Each column maps to a property on the customer type.
- To extend fields, add a new column entry and ensure the underlying type includes the property.

```mermaid
classDiagram
class ColumnDef {
+string accessorKey
+string header
+boolean sortable
+boolean filterable
+function cellRenderer
}
class ColumnsConfig {
+ColumnDef[] columns
+function getColumns()
}
ColumnsConfig --> ColumnDef : "contains"
```

**Diagram sources**
- [columns.tsx](file://src/modules/customers/components/columns.tsx)

**Section sources**
- [columns.tsx](file://src/modules/customers/components/columns.tsx)

### Add Customer Modal
Functionality:
- Opens a dialog to collect required fields.
- Validates inputs before submission.
- Calls the service layer to create a new customer.
- Displays success or error feedback to the user.

```mermaid
sequenceDiagram
participant U as "User"
participant M as "Add Modal"
participant V as "Validation"
participant S as "Customer Services"
participant R as "API Route"
participant T as "Table"
U->>M : Click "Add Customer"
M->>V : Validate form fields
alt Valid
M->>S : Create customer
alt Development
S->>S : Persist to mock store
else Production
S->>R : POST /api/customers
R-->>S : Created customer
end
S-->>M : Success
M-->>T : Trigger refresh
T-->>U : Show updated table
else Invalid
V-->>M : Show errors
end
```

**Diagram sources**
- [add-customer-modal.tsx](file://src/modules/customers/components/add-customer-modal.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [route.ts](file://src/app/api/customers/route.ts)

**Section sources**
- [add-customer-modal.tsx](file://src/modules/customers/components/add-customer-modal.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [route.ts](file://src/app/api/customers/route.ts)

### Row Actions and Bulk Operations
- Per-row actions include edit and delete.
- Bulk operations leverage selected rows to perform batch actions (e.g., delete multiple).
- Confirmations and feedback are provided for destructive actions.

```mermaid
sequenceDiagram
participant U as "User"
participant DT as "Data Table"
participant RA as "Row Actions"
participant S as "Customer Services"
participant R as "API Route"
U->>RA : Select row(s) and choose action
RA->>DT : Get selected IDs
RA->>S : Perform action (update/delete)
alt Development
S->>S : Update mock store
else Production
S->>R : PATCH/DELETE /api/customers/[id]
R-->>S : Acknowledgement
end
S-->>DT : Notify completion
DT-->>U : Refresh and show feedback
```

**Diagram sources**
- [data-table-row-actions.tsx](file://src/modules/customers/components/data-table-row-actions.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [route.ts](file://src/app/api/customers/route.ts)

**Section sources**
- [data-table-row-actions.tsx](file://src/modules/customers/components/data-table-row-actions.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [route.ts](file://src/app/api/customers/route.ts)

### Service Layer and Mock Data Patterns
- Service functions encapsulate all data operations: list, create, update, delete.
- During development, services read/write to an in-memory mock store.
- For production, services call the Next.js API route.
- This pattern allows seamless switching without changing UI code.

```mermaid
graph LR
UI["UI Components"] --> SVC["Customer Services"]
SVC --> MOCK["Mock Store"]
SVC --> API["API Route"]
API --> SVC
```

**Diagram sources**
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [customer-mock-data.ts](file://src/modules/customers/services/customer-mock-data.ts)
- [route.ts](file://src/app/api/customers/route.ts)

**Section sources**
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [customer-mock-data.ts](file://src/modules/customers/services/customer-mock-data.ts)
- [route.ts](file://src/app/api/customers/route.ts)

### API Integration Points
- The API route handles GET, POST, PATCH, DELETE for customers.
- It delegates to the service layer for business logic and persistence.
- Responses conform to the types defined in the service layer.

```mermaid
sequenceDiagram
participant C as "Client"
participant R as "API Route"
participant S as "Customer Services"
participant M as "Mock Data"
C->>R : HTTP request
R->>S : Invoke service method
alt Development
S->>M : Read/write mock data
M-->>S : Result
else Production
S-->>R : Result from backend
end
R-->>C : JSON response
```

**Diagram sources**
- [route.ts](file://src/app/api/customers/route.ts)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [customer-mock-data.ts](file://src/modules/customers/services/customer-mock-data.ts)

**Section sources**
- [route.ts](file://src/app/api/customers/route.ts)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [customer-mock-data.ts](file://src/modules/customers/services/customer-mock-data.ts)

## Dependency Analysis
- The page depends on the data table component.
- The data table composes toolbar, pagination, row actions, column headers, and view options.
- The data table depends on the service layer for data operations.
- The service layer depends on mock data during development and the API route in production.
- Types are shared across components and services to ensure consistency.

```mermaid
graph TB
PAGE["Page"] --> DT["Data Table"]
DT --> TOOLBAR["Toolbar"]
DT --> PAG["Pagination"]
DT --> ROWACT["Row Actions"]
DT --> HDR["Column Header"]
DT --> VIEWOPT["View Options"]
DT --> SVC["Customer Services"]
SVC --> MOCK["Mock Data"]
SVC --> TYPES["Types"]
API["API Route"] --> SVC
```

**Diagram sources**
- [page.tsx](file://src/app/(private)/customers/page.tsx)
- [data-table.tsx](file://src/modules/customers/components/data-table.tsx)
- [data-table-toolbar.tsx](file://src/modules/customers/components/data-table-toolbar.tsx)
- [data-table-pagination.tsx](file://src/modules/customers/components/data-table-pagination.tsx)
- [data-table-row-actions.tsx](file://src/modules/customers/components/data-table-row-actions.tsx)
- [data-table-column-header.tsx](file://src/modules/customers/components/data-table-column-header.tsx)
- [data-table-view-options.tsx](file://src/modules/customers/components/data-table-view-options.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [customer-mock-data.ts](file://src/modules/customers/services/customer-mock-data.ts)
- [customer-types.ts](file://src/modules/customers/services/types/customer-types.ts)
- [route.ts](file://src/app/api/customers/route.ts)

**Section sources**
- [page.tsx](file://src/app/(private)/customers/page.tsx)
- [data-table.tsx](file://src/modules/customers/components/data-table.tsx)
- [data-table-toolbar.tsx](file://src/modules/customers/components/data-table-toolbar.tsx)
- [data-table-pagination.tsx](file://src/modules/customers/components/data-table-pagination.tsx)
- [data-table-row-actions.tsx](file://src/modules/customers/components/data-table-row-actions.tsx)
- [data-table-column-header.tsx](file://src/modules/customers/components/data-table-column-header.tsx)
- [data-table-view-options.tsx](file://src/modules/customers/components/data-table-view-options.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [customer-mock-data.ts](file://src/modules/customers/services/customer-mock-data.ts)
- [customer-types.ts](file://src/modules/customers/services/types/customer-types.ts)
- [route.ts](file://src/app/api/customers/route.ts)

## Performance Considerations
- Prefer server-side pagination and filtering when datasets grow large.
- Debounce search input to reduce unnecessary re-renders and network calls.
- Memoize expensive computations and column definitions.
- Use virtualization for very long lists if needed.
- Avoid unnecessary re-fetches by caching responses where appropriate.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Form validation errors not showing: Ensure validation rules are bound to the correct fields and error states are rendered.
- Table not updating after create/update/delete: Verify that the service returns updated data and triggers a table refresh.
- Sorting or filtering not working: Check column definitions for sortable/filterable flags and confirm query parameters are passed correctly.
- Bulk actions failing: Confirm selected IDs are collected and sent to the service layer; verify API route accepts batch operations if implemented.
- Mock vs production mismatch: Ensure service layer consistently adapts to both mock and API modes.

**Section sources**
- [add-customer-modal.tsx](file://src/modules/customers/components/add-customer-modal.tsx)
- [data-table.tsx](file://src/modules/customers/components/data-table.tsx)
- [data-table-toolbar.tsx](file://src/modules/customers/components/data-table-toolbar.tsx)
- [data-table-row-actions.tsx](file://src/modules/customers/components/data-table-row-actions.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [route.ts](file://src/app/api/customers/route.ts)

## Conclusion
The Customer Management module provides a robust foundation for managing customer records with a clean separation of concerns. The data table offers powerful features like sorting, filtering, pagination, and column customization. The service layer abstracts data access, enabling easy integration with external APIs while maintaining a smooth development experience through mock data. Extensibility is straightforward: add fields to the type, update columns and forms, and wire up service methods.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Extending Customer Fields
Steps:
- Add the new field to the customer type definition.
- Include the field in the create/update request types.
- Add a column definition for display and optional filtering/sorting.
- Update the add/edit modal form to capture the new field.
- Adjust service methods and API route to persist the field.

**Section sources**
- [customer-types.ts](file://src/modules/customers/services/types/customer-types.ts)
- [columns.tsx](file://src/modules/customers/components/columns.tsx)
- [add-customer-modal.tsx](file://src/modules/customers/components/add-customer-modal.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [route.ts](file://src/app/api/customers/route.ts)

### Implementing Custom Actions
Approach:
- Define a new action in the row actions component.
- If it requires confirmation, add a confirmation dialog.
- Call the service layer to perform the operation.
- Provide user feedback and refresh the table.

**Section sources**
- [data-table-row-actions.tsx](file://src/modules/customers/components/data-table-row-actions.tsx)
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)

### Integrating with External APIs
Guidance:
- Replace mock data calls in the service layer with actual HTTP requests to your backend.
- Map API responses to the internal types.
- Handle errors and edge cases consistently.
- Keep the API route as a thin adapter if needed.

**Section sources**
- [customer-services.ts](file://src/modules/customers/services/customer-services.ts)
- [customer-mock-data.ts](file://src/modules/customers/services/customer-mock-data.ts)
- [route.ts](file://src/app/api/customers/route.ts)