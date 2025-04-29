import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FriendRequest,
  FriendRequestStatus,
} from './entities/friend-request.entity';
import { Blocklist } from './entities/blocklist.entity';
import { User } from './entities/user.entity';
import {
  CreateFriendRequestDto,
  FriendRequestParams,
  UpdateFriendRequestDto,
} from './dto/friend-request.dto';
import { BlockUserDto } from './dto/blocklist.dto';
import UserPayload from '../auth/interfaces/user-payload.interface';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger('FriendsService');

  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    @InjectRepository(Blocklist)
    private blocklistRepository: Repository<Blocklist>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async sendFriendRequest(
    currentUser: UserPayload,
    createFriendRequestDto: CreateFriendRequestDto,
  ) {
    try {
      const { receiverId } = createFriendRequestDto;

      // Проверка, что пользователь не отправляет запрос самому себе
      if (currentUser.id === receiverId) {
        throw new BadRequestException('Cannot send friend request to yourself');
      }

      // Проверка существования получателя
      const receiver = await this.userRepository.findOne({
        where: { id: receiverId },
      });
      if (!receiver) {
        throw new NotFoundException('User not found');
      }

      // Проверка, что получатель не заблокировал отправителя
      const isBlocked = await this.blocklistRepository.findOne({
        where: { blocker: receiver, blocked: { id: currentUser.id } },
      });
      if (isBlocked) {
        throw new ForbiddenException('Cannot send friend request');
      }

      // Проверка, что отправитель не заблокировал получателя
      const hasBlocked = await this.blocklistRepository.findOne({
        where: { blocker: { id: currentUser.id }, blocked: receiver },
      });
      if (hasBlocked) {
        throw new BadRequestException(
          'Cannot send friend request to blocked user',
        );
      }

      // Проверка на существующий запрос на дружбу
      const existingRequest = await this.friendRequestRepository.findOne({
        where: [
          { senderId: currentUser.id, receiverId },
          { senderId: receiverId, receiverId: currentUser.id },
        ],
      });

      if (existingRequest) {
        if (existingRequest.status === FriendRequestStatus.PENDING) {
          throw new BadRequestException('Friend request already exists');
        }

        if (existingRequest.status === FriendRequestStatus.ACCEPTED) {
          throw new BadRequestException('Users are already friends');
        }

        // Если запрос был отклонен, обновляем его
        if (existingRequest.status === FriendRequestStatus.REJECTED) {
          existingRequest.status = FriendRequestStatus.PENDING;
          existingRequest.senderId = currentUser.id;
          existingRequest.receiverId = receiverId;
          return await this.friendRequestRepository.save(existingRequest);
        }
      }

      // Создаем новый запрос дружбы
      const friendRequest = this.friendRequestRepository.create({
        senderId: currentUser.id,
        receiverId,
        status: FriendRequestStatus.PENDING,
      });

      return await this.friendRequestRepository.save(friendRequest);
    } catch (error) {
      this.logger.error(error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to send friend request');
    }
  }

  async respondToFriendRequest(
    currentUser: UserPayload,
    updateFriendRequestDto: UpdateFriendRequestDto,
  ) {
    try {
      const { requestId, status } = updateFriendRequestDto;

      // Находим запрос и проверяем, что текущий пользователь является получателем запроса
      const friendRequest = await this.friendRequestRepository.findOne({
        where: {
          id: requestId,
          receiverId: currentUser.id,
          status: FriendRequestStatus.PENDING,
        },
      });

      if (!friendRequest) {
        throw new NotFoundException('Friend request not found');
      }

      // Обновляем статус запроса
      friendRequest.status = status;
      return await this.friendRequestRepository.save(friendRequest);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to respond to friend request',
      );
    }
  }

  async getFriendRequests(
    currentUser: UserPayload,
    params: FriendRequestParams,
  ) {
    try {
      const { status } = params;

      const query = this.friendRequestRepository
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.sender', 'sender')
        .leftJoinAndSelect('request.receiver', 'receiver')
        .where('(request.receiverId = :userId OR request.senderId = :userId)', {
          userId: currentUser.id,
        });

      if (status) {
        query.andWhere('request.status = :status', { status });
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to get friend requests');
    }
  }

  async getFriends(currentUser: UserPayload) {
    try {
      const acceptedRequests = await this.friendRequestRepository.find({
        where: [
          { senderId: currentUser.id, status: FriendRequestStatus.ACCEPTED },
          { receiverId: currentUser.id, status: FriendRequestStatus.ACCEPTED },
        ],
        relations: ['sender', 'receiver'],
      });

      // Формируем список друзей
      return acceptedRequests.map((request) => {
        if (request.senderId === currentUser.id) {
          return {
            id: request.receiver.id,
            username: request.receiver.username,
            firstName: request.receiver.firstName,
            lastName: request.receiver.lastName,
            email: request.receiver.email,
            friendSince: request.updatedAt,
          };
        } else {
          return {
            id: request.sender.id,
            username: request.sender.username,
            firstName: request.sender.firstName,
            lastName: request.sender.lastName,
            email: request.sender.email,
            friendSince: request.updatedAt,
          };
        }
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to get friends');
    }
  }

  async removeFriend(currentUser: UserPayload, friendId: number) {
    try {
      const friendRequest = await this.friendRequestRepository.findOne({
        where: [
          {
            senderId: currentUser.id,
            receiverId: friendId,
            status: FriendRequestStatus.ACCEPTED,
          },
          {
            senderId: friendId,
            receiverId: currentUser.id,
            status: FriendRequestStatus.ACCEPTED,
          },
        ],
      });

      if (!friendRequest) {
        throw new NotFoundException('Friend relationship not found');
      }

      await this.friendRequestRepository.remove(friendRequest);
      return { message: 'Friend removed successfully' };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove friend');
    }
  }

  async blockUser(currentUser: UserPayload, blockUserDto: BlockUserDto) {
    try {
      const { userId } = blockUserDto;

      // Проверка, что пользователь не блокирует самого себя
      if (currentUser.id === userId) {
        throw new BadRequestException('Cannot block yourself');
      }

      // Проверка существования пользователя
      const userToBlock = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!userToBlock) {
        throw new NotFoundException('User not found');
      }

      // Проверка на существующую блокировку
      const existingBlock = await this.blocklistRepository.findOne({
        where: { blocker: { id: currentUser.id }, blocked: userToBlock },
      });

      if (existingBlock) {
        throw new BadRequestException('User is already blocked');
      }

      // Создаем новую запись в черном списке
      const blockRecord = this.blocklistRepository.create({
        blocker: { id: currentUser.id } as User,
        blocked: { id: userId } as User,
      });

      await this.blocklistRepository.save(blockRecord);

      // Если пользователи были друзьями, удаляем их отношения
      const friendRequest = await this.friendRequestRepository.findOne({
        where: [
          {
            senderId: currentUser.id,
            receiverId: userId,
            status: FriendRequestStatus.ACCEPTED,
          },
          {
            senderId: userId,
            receiverId: currentUser.id,
            status: FriendRequestStatus.ACCEPTED,
          },
        ],
      });

      if (friendRequest) {
        await this.friendRequestRepository.remove(friendRequest);
      }

      // Отклоняем все ожидающие запросы на дружбу между пользователями
      const pendingRequests = await this.friendRequestRepository.find({
        where: [
          {
            senderId: currentUser.id,
            receiverId: userId,
            status: FriendRequestStatus.PENDING,
          },
          {
            senderId: userId,
            receiverId: currentUser.id,
            status: FriendRequestStatus.PENDING,
          },
        ],
      });

      if (pendingRequests.length > 0) {
        await Promise.all(
          pendingRequests.map(async (request) => {
            request.status = FriendRequestStatus.REJECTED;
            await this.friendRequestRepository.save(request);
          }),
        );
      }

      return { message: 'User blocked successfully' };
    } catch (error) {
      this.logger.error(error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to block user');
    }
  }

  async unblockUser(currentUser: UserPayload, userId: number) {
    try {
      const blockRecord = await this.blocklistRepository.findOne({
        where: { blocker: { id: currentUser.id }, blocked: { id: userId } },
      });

      if (!blockRecord) {
        throw new NotFoundException('Block record not found');
      }

      await this.blocklistRepository.remove(blockRecord);
      return { message: 'User unblocked successfully' };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to unblock user');
    }
  }

  async getBlockedUsers(currentUser: UserPayload) {
    try {
      const blockedUsers = await this.blocklistRepository.find({
        where: { blocker: { id: currentUser.id } },
        relations: ['blocked'],
      });

      return blockedUsers.map((record) => ({
        id: record.blocked.id,
        username: record.blocked.username,
        firstName: record.blocked.firstName,
        lastName: record.blocked.lastName,
        email: record.blocked.email,
        blockedAt: record.createdAt,
      }));
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to get blocked users');
    }
  }
}
