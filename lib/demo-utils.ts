export function isDemoEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return (
    email === process.env.NEXT_PUBLIC_DEMO_MANAGEMENT_EMAIL ||
    email === process.env.NEXT_PUBLIC_DEMO_HOMEOWNER_EMAIL
  );
}

export function getDemoRoleFromEmail(
  email: string | undefined | null,
): "management" | "homeowner" | null {
  if (email === process.env.NEXT_PUBLIC_DEMO_MANAGEMENT_EMAIL)
    return "management";
  if (email === process.env.NEXT_PUBLIC_DEMO_HOMEOWNER_EMAIL)
    return "homeowner";
  return null;
}
