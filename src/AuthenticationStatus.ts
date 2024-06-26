export interface AuthenticationStatus {
  authenticated: boolean,
  otp_required: boolean,
  token: string
}