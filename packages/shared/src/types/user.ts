export interface User {
  id: number;
  email: string;
  name: string;
  nickname: string;
  nationality?: string;
  job?: string;
  phone?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  name: string;
  nickname: string;
}

export interface UserUpdateRequest {
  nickname?: string;
  nationality?: string;
  job?: string;
  phone?: string;
  profileImageUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, 'id' | 'nickname' | 'profileImageUrl'>;
}
