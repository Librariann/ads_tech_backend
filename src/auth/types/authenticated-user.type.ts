export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName?: string;
  sessionId: string;
};
