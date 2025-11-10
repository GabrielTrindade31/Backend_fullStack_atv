export type UserRole = 'admin' | 'client';

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  date_of_birth: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};
