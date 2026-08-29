# Edit Profile Screen

## Purpose

Edit Profile is the screen for updating an existing connection profile.

Users can select an existing profile from the profile list, update the AWS credential, region, cluster ARN, secret ARN, database, and engine, then save the changes.

## Responsibilities

- Load existing profiles
- Edit profile values
- Resolve the cluster again
- Update the profile
- Delete the profile

## Routing State

This screen is displayed when `currentView === "editProfile"` in `App`.

## Flow

1. Select an existing profile from Query Editor.
2. Navigate to `Edit Profile`.
3. Initialize the form with the current values.
4. Edit the values.
5. Press `Save Profile`.
6. Update the profile and reload the profile list.

## Update Behavior

- The target profile name is stored as `previousName`.
- The new cluster ARN is checked against the currently available clusters.
- If the cluster cannot be found, it is treated as an error.
- If the `credentials` / `config` files in the saved `credentialsDirectory` cannot be read, a credentials read error is displayed.
- After a successful update, the profile list is reloaded and the app returns to Query Editor.

## Delete Operation

Edit Profile provides a delete button. After displaying a confirmation dialog, it calls `deleteConnectionProfile`.

## IPC Integration

- `listConnectionProfiles`
- `listDbClusters`
- `updateConnectionProfile`
- `deleteConnectionProfile`

## Error Display

- If cluster retrieval or connection testing is run while the credentials directory cannot be accessed, a credentials read error is displayed instead of an unexpected error.

## Implementation Files

- [src/renderer/App.tsx](../src/renderer/App.tsx)
- [src/renderer/components/NewProfileForm.tsx](../src/renderer/components/NewProfileForm.tsx)
- [src/main/interfaces/ipc/connectionProfileIpcHandler.ts](../src/main/interfaces/ipc/connectionProfileIpcHandler.ts)
