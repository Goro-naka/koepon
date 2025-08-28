export interface JwtPayload {
  sub: string;        // user ID
  email: string;      // user email
  role: string;       // user role
  iat: number;        // issued at
  exp: number;        // expires at
}