


**Product Requirements Document (PRD)**
**Project:** ProjectFlow – A Simple Project Management App with OneDrive Integration
**Date:** May 3, 2025 (Revised May 3, 2025)
**Author:** ChatGPT

---

## 1. Purpose & Objectives

**Purpose:**
Provide teams with a lightweight web application to create and manage projects, tasks, billing services—and store/retrieve all related documents (deliverables, receipts, invoices) in OneDrive via Microsoft Graph. Validate end-to-end Graph + OneDrive workflows before full app development.

**Objectives:**

* Enable users to sign in with Azure AD (MSAL) and securely call Microsoft Graph.
* CRUD Projects, Tasks, Billing Services.
* Upload new files or attach existing OneDrive items in both Tasks and Billing Services.
* Leverage Azure Static Web Apps + Azure Functions w/ Managed Identity for hosting and Graph/SQL backends.
* Support full local emulation via the SWA CLI & Azure Functions Core Tools before cloud deploy.

---

## 2. Scope

**In Scope (MVP):**

* Azure AD authentication via SWA’s `/.auth` endpoints.
* CRUD APIs in Azure Functions for Projects, Tasks, Billing Services.
* File operations through Microsoft Graph (upload, list, download).
* Data persisted in Azure SQL (Managed Identity auth).
* Local dev with SWA CLI + Functions emulator.

**Out of Scope (MVP):**

* Comments, real-time collaboration, roles beyond basic sign-in.
* Payment processing or invoicing workflows.
* Mobile/desktop native clients.

---

## 3. User Personas

| Persona         | Description                            | Needs                                                     |
| --------------- | -------------------------------------- | --------------------------------------------------------- |
| Individual Dev  | Tests Graph/OneDrive + SWA locally     | Quick setup, stub repo, local emulation                   |
| Project Manager | Tracks Projects, Tasks, Documents      | Intuitive CRUD UI, OneDrive integration                   |
| Finance Admin   | Manages Billing Services & attachments | Simple form, file upload/attach, due-date/amount tracking |
| Team Member     | Completes Tasks & uploads deliverables | Seamless login, clear task context, file preview/download |

---

## 4. User Stories

1. **Authentication & Onboarding**

   * Sign in with Microsoft (Azure AD) via the SWA `/.auth/login/aad` flow.
   * Retrieve user claims via `/.auth/me`.

2. **Project Management**

   * Create/Read/Update/Delete Projects (title, description).

3. **Task Management**

   * CRUD Tasks under Projects (title, description, due date).
   * Upload new files or browse & attach existing OneDrive documents.
   * Preview / download attachments.

4. **Billing Service Management**

   * CRUD Billing Services under Projects (name, amount, due date).
   * Upload new receipts/invoices or browse & attach existing OneDrive files.
   * Preview / download attached receipts/invoices.

---

## 5. Functional Requirements

| ID   | Feature                                  | Description                                                                                |
| ---- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| FR1  | Azure AD Sign-In                         | Via SWA built-in `/.auth` (login, logout, `/.auth/me`)                                     |
| FR2  | Projects CRUD                            | `/api/projects` endpoints                                                                  |
| FR3  | Tasks CRUD                               | `/api/projects/{pid}/tasks` and `/api/tasks/{tid}`                                         |
| FR4  | File Upload (Tasks)                      | Graph: `POST /me/drive/items/{folder}/children`                                            |
| FR5  | File Browse & Attach (Tasks)             | Graph: `GET /me/drive/root/children`                                                       |
| FR6  | File Download/Preview (Tasks)            | Graph: get `@microsoft.graph.downloadUrl`                                                  |
| FR7  | Billing Services CRUD                    | `/api/projects/{pid}/billing` and `/api/billing/{bid}`                                     |
| FR8  | File Upload (Billing Services)           | As FR4 but under billing folder                                                            |
| FR9  | File Browse & Attach (Billing Services)  | As FR5 but scoped to billing folder                                                        |
| FR10 | File Download/Preview (Billing Services) | As FR6 but under billing                                                                   |
| FR11 | API Authorization                        | Azure Functions use **DefaultAzureCredential** + Managed Identity for Graph + SQL          |
| FR12 | Azure SQL Managed-Identity Auth          | SQL connection via `Authentication=Active Directory Managed Identity` in connection string |
| FR13 | Network & Firewall Configuration         | SQL server public access = Selected networks + “Allow Azure services” checked              |
| FR14 | Easy-Auth on Function App (fallback)     | If not using SWA, enable App Service Authentication on Functions for `/.auth/*` endpoints  |

---

## 6. Non-Functional Requirements

* **Performance:**

  * Page load < 2 s; Graph queries < 1 s; SQL queries < 500 ms.
* **Security:**

  * HTTPS everywhere; no secrets in client; Managed Identity; CSRF/XSS protections.
* **Scalability:**

  * Support up to 1 000 users in free/low-tier limits.
* **Maintainability:**

  * Clean separation: SPA front-end, Azure Functions back-end; modular code.

---

## 7. System Architecture

```text
[Browser / SPA]
   ↕  HTTPS (SWA auth)
[Azure Static Web Apps]
   ↕  /api/* proxy
[Azure Functions w/ MI]
   ↕  Graph & SQL tokens (DefaultAzureCredential)
[Microsoft Graph]   [Azure SQL]
```

**Key Endpoints**:

* Auth:

  * `/.auth/login/aad` → Azure AD sign-in
  * `/.auth/logout/aad` → sign-out
  * `/.auth/me` → user claims JSON
* API:

  * Projects, Tasks, Billing (see §4 User Stories)
  * FileOps endpoints under `/api`

---

## 8. Azure Setup Checklist

1. **GitHub Stub Repo** (for early SWA):

   * `index.html` + empty `api/` folder.
2. **Azure Static Web App**:

   * Connect to stub repo; App location `/`, API location `api`.
3. **AAD App Registration**:

   * Platform = **Web**; Redirect URI = `https://salyersaipmapp.azurestaticapps.net/.auth/login/aad/callback`
   * Logout URI = `https://salyersaipmapp.azurestaticapps.net/.auth/logout/aad`
   * No implicit grant needed.
4. **SWA Authentication**:

   * In SWA → Authentication → add Azure AD identity provider.
5. **Azure Functions** (if standalone):

   * Consumption plan, East US 2; enable system-assigned identity; (Or skip if using built-in SWA API).
6. **Azure SQL**:

   * Server with Entra-only auth; admin = your user; DB = `ProjectManageApp`; public access = Selected networks + Allow Azure services.
   * Register `Microsoft.ChangeAnalysis` RP.
7. **SQL Firewall**:

   * Check “Allow Azure services and resources to access this server”
8. **Grant SQL User**:

   ```sql
   CREATE USER [projectapppm] FROM EXTERNAL PROVIDER;
   ALTER ROLE db_datareader ADD MEMBER [projectapppm];
   ALTER ROLE db_datawriter ADD MEMBER [projectapppm];
   ```
9. **Connection String**:

   * SWA Function App → Environment variables → Connection strings →

     ```text
     Name: SqlConnectionString  
     Value: Server=tcp:salyersaipmapp.database.windows.net,1433; Authentication=Active Directory Managed Identity; Database=ProjectManageApp;  
     Type: SQLAzure
     ```
10. **Graph Permissions**:

    * AAD → Enterprise apps → your Function App → API permissions → Microsoft Graph → Files.ReadWrite.All → Grant admin consent.

---

## 9. Local Development Setup

1. **Install Tools**

   ```bash
   npm install -g @azure/static-web-apps-cli azure-functions-core-tools@4
   ```
2. **Stub `api/local.settings.json`**

   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "AzureWebJobsDashboard": "",
       "SqlConnectionString": "Server=tcp:salyersaipmapp.database.windows.net,1433;Authentication=Active Directory Interactive;Database=ProjectManageApp;"
     }
   }
   ```
3. **Run**

   ```bash
   swa start http://localhost:3000 --api-location ./api
   ```
4. **Test Auth & API**

   * `https://localhost:4280/.auth/login/aad`
   * `https://localhost:4280/api/db-test` (after you add the smoke-test function).

---

## 10. Next Steps & Timeline

| Milestone                              | Target Date   |
| -------------------------------------- | ------------- |
| Stub Repo + SWA Provisioned            | May 5, 2025   |
| Local Auth + DB-Test Function Verified | May 7, 2025   |
| Projects/Tasks CRUD Functions          | May 14, 2025  |
| FileOps in Tasks (Graph)               | May 21, 2025  |
| Billing Services CRUD + FileOps        | May 28, 2025  |
| UI Components & Integration            | June 4, 2025  |
| End-to-End Testing & Bug Fixes         | June 11, 2025 |
| MVP Go-Live on SWA                     | June 17, 2025 |

---

**Review & Feedback**
