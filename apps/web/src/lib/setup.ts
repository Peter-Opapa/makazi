import { apiFetch } from "./api";

export interface SetupProgress {
  accountCreated: boolean;
  emailVerified: boolean;
  hasProperty: boolean;
  hasPaymentDestination: boolean;
  hasCaretaker: boolean;
  hasTenant: boolean;
}

export function getSetupProgress() {
  return apiFetch<SetupProgress>("/setup/progress");
}
