import IAccountUser from './account-user.interface';

export default interface IFriendUser extends IAccountUser {
  friendSince: Date;
}
