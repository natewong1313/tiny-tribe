export interface UsernameValidationResult {
  valid: boolean;
  error?: string;
}

export const validateUsername = (
  username: string,
): UsernameValidationResult => {
  if (!username.trim()) {
    return { error: "Username is required", valid: false };
  }

  if (username.endsWith("_")) {
    return { error: "Username cannot end with underscore", valid: false };
  }

  return { valid: true };
};
