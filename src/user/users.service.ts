import { Get, Injectable, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.userRepository.find({
      where: {
        id: id,
      },
    });
  }
}
