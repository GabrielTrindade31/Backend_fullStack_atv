export interface User {
  id: string;
  email: string | null;
  password_hash: string | null;
  name: string;
  date_of_birth: string | null;
  google_id: string | null;
  role: 'user' | 'backlog';
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string | null;
  name: string;
  dateOfBirth: string | null;
  googleId: string | null;
  role: 'user' | 'backlog';
  createdAt: string;
  updatedAt: string;
}

export function mapToPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    dateOfBirth: user.date_of_birth,
    googleId: user.google_id,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
