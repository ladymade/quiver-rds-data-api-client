# Query Editor Screen

## Purpose

Query Editor is the screen for running SQL against the selected connection profile and viewing results and schema information.

The main uses of this screen are:

- Switch connection profiles
- Browse tables
- View columns
- Enter and run SQL
- View query results

## Responsibilities

- Select a profile
- Display Schema Explorer
- Fetch tables and columns
- Display the SQL editor
- Display query results
- Navigate to Create Profile / Edit Profile

## Routing State

This screen is displayed when `currentView === "queryEditor"` in `App`.

## Main Components

### QueryEditorPage

- SQL editor
- Split-view layout
- Query result display
- table explorer

### QueryResults

- Displays the query result table
- Handles row counts and pagination

### Schema Explorer

- Database name
- Table name
- List of matching columns
- Expanded/collapsed state
- Refresh Schema Explorer reloads the table list for the selected profile and resets expanded column information.

## Flow

1. Load saved profiles with `listConnectionProfiles`.
2. Determine the initial selected profile.
3. Display the SQL editor.
4. Fetch the table list and make tables expandable.
5. Fetch the column list when a table is expanded.
6. Run SQL with the `Run Query` button or the SQL editor keyboard shortcut and display query results.

## IPC Integration

### Read Operations

- `listConnectionProfiles`
- `listTables`
- `listTableColumns`

### Execute Operations

- `executeQuery`

## Runtime Behavior

- When SQL is entered and `Run Query` is executed, `executeQuery` is called.
- While the SQL editor is focused, `Ctrl + Enter` on Windows/Linux or `Cmd + Enter` on macOS executes the query.
- The keyboard shortcut uses the same profile selection, non-empty SQL, and in-progress guards as the `Run Query` button.
- On success, `ExecuteQueryData` is displayed as a table.
- On failure, `ErrorDialog` is displayed with detailed information.
- Loading indicators are shown while tables or columns are being fetched.
- If the `credentials` / `config` files in the saved profile's `credentialsDirectory` cannot be read, table fetching, column fetching, and query execution display a credentials read error.

## Implementation Files

- [src/renderer/components/QueryEditorPage.tsx](../src/renderer/components/QueryEditorPage.tsx)
- [src/renderer/components/QueryResults.tsx](../src/renderer/components/QueryResults.tsx)
- [src/renderer/App.tsx](../src/renderer/App.tsx)
- [src/main/interfaces/ipc/rdsIpcHandler.ts](../src/main/interfaces/ipc/rdsIpcHandler.ts)
- [src/shared/types/ipc.ts](../src/shared/types/ipc.ts)
