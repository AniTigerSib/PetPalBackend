import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import {
  FindOptionsRelations,
  FindOptionsSelect,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
// import { OauthAccount } from './entities/oauth-account.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashingService } from 'src/common/hashing/hashing.service';
import { TokenInfoDto } from './dto/token-info.dto';
import { ROLES } from './constants/roles.constant';
import { Role } from './entities/role.entity';
import IAccountUser from './interfaces/account-user.interface';
import IProfileUser from './interfaces/profile-user.interface';
import { PROFILE_USER_SELECT } from './constants/profile-select.constant';
import {
  FriendRequest,
  FriendRequestStatus,
} from './entities/friend-request.entity';
// import { Profile as GProfile } from 'passport-google-oauth20';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    // @InjectRepository(OauthAccount)
    // private readonly oauthAccountRepository: Repository<OauthAccount>,
    private readonly hashingService: HashingService,
  ) {}
  private readonly logger = new Logger('UsersService');

  async findUserById(
    id: number,
    select?: FindOptionsSelect<User>,
    relations?: FindOptionsRelations<User>,
  ): Promise<User | Partial<User> | null> {
    try {
      return await this.userRepository.findOne({
        where: {
          id: id,
        },
        select,
        relations,
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getProfileById(id: number, searcherId: number): Promise<IProfileUser> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id,
        },
        select: {
          ...PROFILE_USER_SELECT,
        },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Проверяем, являются ли пользователи друзьями
      const friendRequest = await this.friendRequestRepository.findOne({
        where: [
          {
            senderId: searcherId,
            receiverId: id,
          },
        ],
      });

      const friendRequestRecieved = await this.friendRequestRepository.findOne({
        where: [
          {
            senderId: id,
            receiverId: searcherId,
          },
        ],
      });

      let friendStatus = '';
      if (friendRequest) {
        friendStatus = this.friendStatusToString(friendRequest.status);
      } else if (friendRequestRecieved) {
        friendStatus =
          this.friendStatusToString(friendRequestRecieved.status) + 'Request';
      }

      // Формируем объект IProfileUser
      const profileUser: IProfileUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        username: user.username,
        bio: user.bio,
        friendStatus: friendStatus,
        friendReqId: friendRequest?.id || friendRequestRecieved?.id || null,
      };

      return profileUser;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  friendStatusToString(status: FriendRequestStatus): string {
    if (status === FriendRequestStatus.ACCEPTED) {
      return 'accepted';
    } else if (status === FriendRequestStatus.PENDING) {
      return 'pending';
    } else if (status === FriendRequestStatus.REJECTED) {
      return 'rejected';
    } else {
      return '';
    }
  }

  async findUserByUsername(
    username: string,
    select?: FindOptionsSelect<User>,
    relations?: FindOptionsRelations<User>,
  ): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: {
          username,
        },
        select,
        relations,
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async findUserByEmail(
    email: string,
    select?: FindOptionsSelect<User>,
    relations?: FindOptionsRelations<User>,
  ): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: {
          email,
        },
        select,
        relations,
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async findUsersByName(
    searchQuery: string,
    select?: FindOptionsSelect<User>,
    relations?: FindOptionsRelations<User>,
  ): Promise<IAccountUser[]> {
    try {
      if (!searchQuery || searchQuery.trim() === '') {
        return [];
      }

      const trimmedQuery = searchQuery.trim();

      const queryBuilder = this.userRepository.createQueryBuilder('user');

      // Поиск по firstName ИЛИ lastName
      queryBuilder.where(
        'user.firstName ILIKE :searchQuery OR user.lastName ILIKE :searchQuery',
        {
          searchQuery: `%${trimmedQuery}%`,
        },
      );

      if (select) {
        const selectFields = Object.keys(select).filter((key) => select[key]);
        queryBuilder.select(selectFields.map((field) => `user.${field}`));
      }

      if (relations) {
        const relationKeys = Object.keys(relations).filter(
          (key) => relations[key],
        );
        relationKeys.forEach((relation) => {
          queryBuilder.leftJoinAndSelect(`user.${relation}`, relation);
        });
      }

      return (await queryBuilder.getMany()) as IAccountUser[];
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  // Альтернативный вариант с поиском по полному имени (firstName + lastName)
  async findUsersByFullName(
    searchQuery: string,
    select?: FindOptionsSelect<User>,
    relations?: FindOptionsRelations<User>,
  ): Promise<IAccountUser[]> {
    try {
      if (!searchQuery || searchQuery.trim() === '') {
        return [];
      }

      const trimmedQuery = searchQuery.trim();

      const queryBuilder = this.userRepository.createQueryBuilder('user');

      // Поиск по firstName, lastName или полному имени
      queryBuilder.where(
        `(user.firstName ILIKE :searchQuery 
          OR user.lastName ILIKE :searchQuery 
          OR CONCAT(user.firstName, ' ', user.lastName) ILIKE :searchQuery)`,
        {
          searchQuery: `%${trimmedQuery}%`,
        },
      );

      if (select) {
        const selectFields = Object.keys(select).filter((key) => select[key]);
        queryBuilder.select(selectFields.map((field) => `user.${field}`));
      }

      if (relations) {
        const relationKeys = Object.keys(relations).filter(
          (key) => relations[key],
        );
        relationKeys.forEach((relation) => {
          queryBuilder.leftJoinAndSelect(`user.${relation}`, relation);
        });
      }

      return (await queryBuilder.getMany()) as IAccountUser[];
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  private async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const userRole = await this.roleRepository.findOne({
        where: { name: ROLES.USER },
      });
      if (!userRole) {
        throw new InternalServerErrorException('User role not found');
      }
      const user = this.userRepository.create(createUserDto);
      user.roles = [userRole];
      this.logger.log(`User ${user.username} successfully created`);
      return await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  async createUserSecure(createUserDto: CreateUserDto): Promise<User> {
    const userExists = await this.userRepository.exists({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (userExists) {
      throw new ConflictException(
        'User with such username or email already exists',
      );
    }

    return await this.createUser(createUserDto);
  }

  async shiftTokenVersion(userId: number): Promise<UpdateResult> {
    return await this.userRepository.update(
      { id: userId },
      { tokenVersion: () => 'tokenVersion + 1' },
    );
  }

  // async findOrCreateOauthUser(
  //   profile: GProfile,
  //   provider: string,
  // ): Promise<User> {
  //   const providerUserId = profile.id;

  //   const existingOAuthAccount = await this.oauthAccountRepository.findOne({
  //     where: { provider, providerUserId },
  //     relations: ['user'],
  //   });

  //   if (existingOAuthAccount) return existingOAuthAccount.user;
  // }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    try {
      // Используем QueryRunner для транзакции
      const queryRunner =
        this.userRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Проверяем существование пользователя для обновления
        const existingUser = await queryRunner.manager.findOne(User, {
          where: { id: userId },
        });

        if (!existingUser) {
          await queryRunner.rollbackTransaction();
          return null;
        }

        // Если обновляется username, проверяем уникальность
        if (
          updateUserDto.username &&
          updateUserDto.username !== existingUser.username
        ) {
          const userWithSameUsername = await queryRunner.manager.findOne(User, {
            where: {
              username: updateUserDto.username,
              id: Not(userId), // исключаем текущего пользователя
            },
          });

          if (userWithSameUsername) {
            await queryRunner.rollbackTransaction();
            throw new ConflictException(
              'User with such username already exists',
            );
          }
        }

        // Выполняем обновление и получаем результат
        const updateResult = await queryRunner.manager.update(
          User,
          { id: userId },
          updateUserDto,
        );

        // Проверяем, что обновление действительно произошло
        if (updateResult.affected === 0) {
          await queryRunner.rollbackTransaction();
          return null;
        }

        // Получаем обновленного пользователя
        const updatedUser = await queryRunner.manager.findOne(User, {
          where: { id: userId },
        });

        await queryRunner.commitTransaction();
        return updatedUser;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error('Error updating user:', error);

      // Если это уже наша бизнес-ошибка, пробрасываем как есть
      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async updateUserPassword(
    token: TokenInfoDto,
    password: string,
  ): Promise<UpdateResult> {
    const passwordHash = await this.hashingService.hash(password);
    try {
      return await this.userRepository.update(
        { id: token.id },
        { passwordHash },
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async deleteUser(token: TokenInfoDto) {
    const user = await this.userRepository.findOne({
      where: { id: token.id },
      relations: ['profile'],
    });

    if (!user) {
      this.logger.error(
        'User validated, but not found',
        'deleteUser',
        `UID: ${token.id.toString()}`,
      );
      throw new InternalServerErrorException();
    }

    try {
      return await this.userRepository.delete({ id: user.id });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}

// TODO: refactor Update methods to GraphQL
