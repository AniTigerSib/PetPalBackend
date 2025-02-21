import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { Profile } from './entities/users-profile.entity';
// import { OauthAccount } from './entities/oauth-account.entity';
import { ProfileDto } from './dto/profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashingService } from 'src/common/hashing/hashing.service';
import { JwtPayloadDto } from 'src/auth/dto/jwt-payload.dto';

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

  async findUserById(id: number): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: {
          id: id,
        },
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

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = this.userRepository.create(createUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async createUserSecure(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException(
        'User with such username or email already exists',
      );
    }

    createUserDto.passwordHash = await this.hashingService.hash(
      createUserDto.passwordHash,
    );

    return await this.createUser(createUserDto);
  }

  async updateUser(
    token: JwtPayloadDto,
    updateUserDto: UpdateUserDto,
  ): Promise<void> {
    await this.userRepository.update(
      {
        id: token.id,
      },
      updateUserDto,
    );
  }

  async createProfileSecure(
    token: JwtPayloadDto,
    profileDto: ProfileDto,
  ): Promise<Profile> {
    let user = await this.findUserById(token.id);

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

  async createProfile(user: User, profileDto: ProfileDto): Promise<Profile> {
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

  async updateProfile(token: JwtPayloadDto, profileDto: ProfileDto) {
    const user = await this.findUserById(token.id);

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

  async deleteUser(token: JwtPayloadDto) {
    const user = await this.findUserById(token.id);

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
        await this.profileRepository.delete(user.profile);
      }
      return await this.userRepository.delete(user);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
