type KnownFault =
  | "credentials:list:throw"
  | "credentials:list-from-directory:throw"
  | "rds:list-db-clusters:throw"
  | "rds:test-connection:throw"
  | "rds:list-tables:throw"
  | "rds:list-table-columns:throw"
  | "rds:execute-query:throw"
  | "profiles:list:throw"
  | "profiles:create:throw"
  | "profiles:update:throw"
  | "profiles:delete:throw"
  | "settings:get:throw"
  | "settings:save:throw";

function parseFaultSet(): Set<string> {
  const raw = process.env.QUVER_E2E_FAIL?.trim();
  if (raw == null || raw.length === 0) {
    return new Set();
  }

  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  );
}

export function shouldInjectFault(fault: KnownFault): boolean {
  const faults = parseFaultSet();
  return faults.has(fault);
}

export function throwIfFaultInjected(fault: KnownFault, message: string): void {
  if (!shouldInjectFault(fault)) {
    return;
  }

  const error = new Error(message);
  error.name = "InjectedE2eFault";
  throw error;
}
