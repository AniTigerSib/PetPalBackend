import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import AuthorizedRequest from '../common/interfaces/request.interface';
import {
  CreateFriendRequestDto,
  FriendRequestParams,
  UpdateFriendRequestDto,
} from './dto/friend-request.dto';
import { BlockUserDto } from './dto/blocklist.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('friends')
@Auth('user')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Auth('user')
  @Post('requests')
  async sendFriendRequest(
    @Req() request: AuthorizedRequest,
    @Body() createFriendRequestDto: CreateFriendRequestDto,
  ) {
    return this.friendsService.sendFriendRequest(
      request.user,
      createFriendRequestDto,
    );
  }

  @Auth('user')
  @Put('requests')
  async respondToFriendRequest(
    @Req() request: AuthorizedRequest,
    @Body() updateFriendRequestDto: UpdateFriendRequestDto,
  ) {
    return this.friendsService.respondToFriendRequest(
      request.user,
      updateFriendRequestDto,
    );
  }

  @Auth('user')
  @Get('requests')
  async getFriendRequests(
    @Req() request: AuthorizedRequest,
    @Query() params: FriendRequestParams,
  ) {
    return this.friendsService.getFriendRequests(request.user, params);
  }

  @Auth('user')
  @Get()
  async getFriends(
    @Req() request: AuthorizedRequest,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.friendsService.getFriends(request.user, paginationDto);
  }

  @Auth('user')
  @Delete(':id')
  async removeFriend(
    @Req() request: AuthorizedRequest,
    @Param('id', ParseIntPipe) friendId: number,
  ) {
    return this.friendsService.removeFriend(request.user, friendId);
  }

  @Auth('user')
  @Post('block')
  async blockUser(
    @Req() request: AuthorizedRequest,
    @Body() blockUserDto: BlockUserDto,
  ) {
    return this.friendsService.blockUser(request.user, blockUserDto);
  }

  @Auth('user')
  @Delete('block/:id')
  async unblockUser(
    @Req() request: AuthorizedRequest,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    return this.friendsService.unblockUser(request.user, userId);
  }

  @Auth('user')
  @Get('block')
  async getBlockedUsers(@Req() request: AuthorizedRequest) {
    return this.friendsService.getBlockedUsers(request.user);
  }
}
