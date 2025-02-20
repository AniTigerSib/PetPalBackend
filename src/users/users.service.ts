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
import { OauthAccount } from './entities/oauth-account.entity';
import { ProfileDto } from './dto/profile.dto';
import { UserFromTokenDto } from './dto/user-from-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashingService } from 'src/common/hashing/hashing.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(OauthAccount)
    private readonly oauthAccountRepository: Repository<OauthAccount>,
    private readonly hashingService: HashingService,
  ) {}
  private readonly logger = new Logger('UsersService');

  async findById(id: number): Promise<User | null> {
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

  async createUserExtended(createUserDto: CreateUserDto): Promise<User> {
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
    uft: UserFromTokenDto,
    updateUserDto: UpdateUserDto,
  ): Promise<void> {
    await this.userRepository.update(
      {
        id: uft.id,
      },
      updateUserDto,
    );
  }

  async createProfile(
    uft: UserFromTokenDto,
    profile: ProfileDto,
  ): Promise<Profile> {
    let user = await this.findUserByUsername(uft.username);

    if (!user) {
      this.logger.error(
        'User validated, but not found',
        'createProfile',
        `UID: ${uft.id.toString()}`,
      );
      throw new InternalServerErrorException();
    }

    if (user.profile) {
      throw new BadRequestException('Profile already exists');
    }

    try {
      let profileDb = this.profileRepository.create(profile);
      profileDb = await this.profileRepository.save(profileDb);
      user.profile = profileDb;
      user = await this.userRepository.save(user);
      return profileDb;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
