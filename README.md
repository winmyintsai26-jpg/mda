# Manufacturing Data Platform (MDA)

## Project Overview
Manufacturing Data Platform (MDA) is a web application for uploading spreadsheet data, analyzing table structure, validating data quality, previewing editable rows, and importing the prepared dataset into MySQL.

## Problem Statement
Manufacturing teams often receive operational data in spreadsheets with inconsistent formatting, mixed data types, and varying header conventions. Manual cleanup and SQL import preparation are time-consuming and error-prone. MDA reduces this risk by guiding users through a structured analyze-preview-import flow.

## Architecture
- Frontend: React + Vite UI for upload, preview, and import interactions.
- Backend API: ASP.NET Core minimal APIs for workbook analysis and MySQL import.
- Analysis Engine: workbook scanning, region detection, header detection, table classification, validation, column detection, and data type detection.
- Import Engine: schema discovery, column mapping, value normalization, and transactional inserts.

## Workflow
1. Upload workbook file.
2. Analyze workbook structure.
3. Review and edit preview table.
4. Connect to MySQL and select destination.
5. Validate column mapping and import.

## Features
- XLS/XLSX/XLSM workbook loading.
- Automated table/header detection.
- Editable preview with normalization helpers.
- MySQL schema inspection and mapping.
- Normalized header matching for robust column alignment.
- Import preflight validation for required destination columns.
- Collision detection for ambiguous normalized headers.

## Screenshots
- Placeholder: Dashboard upload screen.
- Placeholder: Preview table editing screen.
- Placeholder: Import mapping and schema comparison screen.

## How to Run
### Backend
1. Open terminal in backend/MDA.API.
2. Run: dotnet restore
3. Run: dotnet run

### Frontend
1. Open terminal in frontend.
2. Run: npm install
3. Run: npm run dev

### Environment
- Frontend API base URL is configurable via VITE_API_BASE_URL.
- Default API URL: http://localhost:5176

## Future Roadmap
- Stronger test coverage for full analyze-to-import scenarios.
- Additional import adapters beyond MySQL.
- Role-based access and audit logging.
- Batch job orchestration for scheduled imports.

## Known Limitations
- Current UI is optimized for single-user workflow sessions.
- Large workbook performance depends on worksheet shape and available memory.
- Import assumes destination table schema is stable during execution.
