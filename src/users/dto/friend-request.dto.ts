import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { FriendRequestStatus } from '../entities/friend-request.entity';

export class CreateFriendRequestDto {
  @IsNotEmpty()
  @IsInt()
  receiverId: number;
}

export class UpdateFriendRequestDto {
  @IsNotEmpty()
  @IsInt()
  requestId: number;

  @IsNotEmpty()
  @IsEnum(FriendRequestStatus)
  status: FriendRequestStatus;
}

export class FriendRequestParams {
  @IsOptional()
  @IsEnum(FriendRequestStatus)
  status?: FriendRequestStatus;
}
