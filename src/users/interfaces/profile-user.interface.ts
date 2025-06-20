import IAccountUser from './account-user.interface';

export default interface IProfileUser extends IAccountUser {
  username: string;
  bio: string;
  friendStatus: string;
  friendReqId: number | null;
}
