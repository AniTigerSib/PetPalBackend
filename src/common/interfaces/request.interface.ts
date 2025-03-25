import { Request } from 'express';
import UserPayload from 'src/auth/interfaces/user-payload.interface';

export default interface AuthorizedRequest extends Request {
  user: UserPayload;
}
