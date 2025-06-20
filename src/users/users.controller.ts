import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import AuthorizedRequest from 'src/common/interfaces/request.interface';
import IProfileUser from './interfaces/profile-user.interface';
import IAccountUser from './interfaces/account-user.interface';
import { SEARCH_USER_SELECT } from './constants/user-search.constant';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auth('user')
  @Get(':id')
  async findOne(
    @Req() request: AuthorizedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Partial<User>> {
    return this.usersService.getProfileById(id, request.user.id);
  }

  @Auth('user')
  @Get()
  async searchUsers(@Query('q') searchQuery: string): Promise<IAccountUser[]> {
    if (!searchQuery || searchQuery.trim() === '') {
      return [];
    }

    const users = await this.usersService.findUsersByName(
      searchQuery,
      SEARCH_USER_SELECT,
    );

    return users;
  }

  @Auth('user')
  @Put(':id')
  async updateUserProfile(
    @Req() request: AuthorizedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() profile: UpdateUserDto,
  ): Promise<IProfileUser> {
    if (request.user.id !== id) {
      throw new ForbiddenException('Incorrect request');
    }

    // Обновляем пользователя
    const updatedUser = await this.usersService.updateUser(id, profile);

    // Если пользователь не найден или не был обновлен
    if (!updatedUser) {
      throw new NotFoundException('User not found or could not be updated');
    }

    // Преобразуем User в IProfileUser (если нужно)
    return this.mapUserToProfile(updatedUser);
  }

  private mapUserToProfile(user: User): IProfileUser {
    // Убираем поля, которые не должны возвращаться клиенту
    const profileData: IProfileUser = {
      ...user,
      friendStatus: '',
      friendReqId: 0,
    };
    return profileData;
  }
}
