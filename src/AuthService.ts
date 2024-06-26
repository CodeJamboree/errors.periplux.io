export class AuthService {
  authenticated: boolean = false;
  isLoggedIn() {
    return this.authenticated;
  }
  setIsLoggedIn(value: boolean) {
    this.authenticated = value;
  }
}