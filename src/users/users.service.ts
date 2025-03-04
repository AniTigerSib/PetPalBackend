import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FindOptionsSelect, Repository, UpdateResult } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { Profile } from './entities/users-profile.entity';
// import { OauthAccount } from './entities/oauth-account.entity';
import { ProfileDto } from './dto/profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashingService } from 'src/common/hashing/hashing.service';
import { TokenInfoDto } from './dto/token-info.dto';
// import { Profile as GProfile } from 'passport-google-oauth20';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    // @InjectRepository(OauthAccount)
    // private readonly oauthAccountRepository: Repository<OauthAccount>,
    private readonly hashingService: HashingService,
  ) {}
  private readonly logger = new Logger('UsersService');

  async findUserById(
    id: number,
    select?: string[],
  ): Promise<User | Partial<User> | null> {
    try {
      return await this.userRepository.findOne({
        where: {
          id: id,
        },
        select: select ? (select as FindOptionsSelect<User>) : undefined,
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async findUserByUsername(username: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: {
          username,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: {
          email,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  private async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = this.userRepository.create(createUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(error);
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
    token: TokenInfoDto,
    updateUserDto: UpdateUserDto,
  ): Promise<UpdateResult> {
    if (updateUserDto.username) {
      const userExists = await this.userRepository.exists({
        where: {
          username: updateUserDto.username,
        },
      });
      if (userExists) {
        throw new ConflictException('User with such username already exists');
      }
    }
    try {
      return await this.userRepository.update({ id: token.id }, updateUserDto);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
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
      if (user.profile) {
        await this.profileRepository.delete({ id: user.profile.id });
      }
      return await this.userRepository.delete({ id: user.id });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async createProfileSecure(
    token: TokenInfoDto,
    profileDto: ProfileDto,
  ): Promise<Profile> {
    let user = await this.userRepository.findOne({
      where: { id: token.id },
      relations: ['profile'],
    });

    if (!user) {
      this.logger.error(
        'User validated, but not found',
        'createProfileSecure',
        `UID: ${token.id.toString()}`,
      );
      throw new InternalServerErrorException();
    }

    if (user.profile) {
      throw new BadRequestException('Profile already exists');
    }

    try {
      let profile = this.profileRepository.create(profileDto);
      profile = await this.profileRepository.save(profile);
      user.profile = profile;
      user = await this.userRepository.save(user);
      return profile;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  private async createProfile(
    user: User,
    profileDto: ProfileDto,
  ): Promise<Profile> {
    try {
      let profile = this.profileRepository.create(profileDto);
      profile = await this.profileRepository.save(profile);
      user.profile = profile;
      user = await this.userRepository.save(user);
      return profile;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async updateProfile(
    token: TokenInfoDto,
    profileDto: ProfileDto,
  ): Promise<UpdateResult | Profile> {
    // TODO: check if DTO is empty
    const user = await this.userRepository.findOne({
      where: { id: token.id },
      relations: ['profile'],
    });

    if (!user) {
      this.logger.error(
        'User validated, but not found',
        'updateProfile',
        `UID: ${token.id.toString()}`,
      );
      throw new InternalServerErrorException();
    }

    if (!user.profile) {
      return this.createProfile(user, profileDto);
    }

    try {
      return this.profileRepository.update(
        {
          id: user.profile.id,
        },
        profileDto,
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}

// TODO: refactor Update methods to GraphQL
