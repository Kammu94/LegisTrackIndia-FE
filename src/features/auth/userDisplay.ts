import type { AuthUser } from '../../api/apiSlice';

export const getUserDisplayName = (user: AuthUser | null) => {
  const firstName = user?.firstName?.trim();
  if (firstName) {
    return firstName;
  }

  return user?.email ?? '';
};

export const getUserInitial = (user: AuthUser | null) => {
  const displayName = getUserDisplayName(user);
  return displayName ? displayName.charAt(0).toUpperCase() : '?';
};
