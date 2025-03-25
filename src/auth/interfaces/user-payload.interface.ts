export default interface UserPayload {
  id: number;
  email: string;
  username: string;
  roles: string[];
  // TODO: add permissions
}
