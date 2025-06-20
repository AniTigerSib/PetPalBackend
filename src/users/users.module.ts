import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { OauthAccount } from './entities/oauth-account.entity';
import { HashingService } from 'src/common/hashing/hashing.service';
import { BcryptService } from 'src/common/hashing/bcrypt.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendRequest } from './entities/friend-request.entity';
import { Blocklist } from './entities/blocklist.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      OauthAccount,
      Role,
      Permission,
      FriendRequest,
      Blocklist,
    ]),
  ],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    UsersService,
    FriendsService,
  ],
  controllers: [UsersController, FriendsController],
  exports: [UsersService],
})
export class UsersModule {}
