// IPC channel names and shared types between Main and Renderer processes.
// All types here must be serializable (no class instances, no functions).

// Replace this with a union of string literals as channels are defined, e.g.:
// export type IpcChannel = "connection:list" | "query:execute";
export type IpcChannel = string;

// Extend this file as IPC channels are added.
