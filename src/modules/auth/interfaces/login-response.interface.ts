import { UserInfo } from './user-info.interface';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}