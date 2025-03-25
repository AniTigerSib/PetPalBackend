import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BcryptService } from './common/hashing/bcrypt.service';
import { TokenModule } from './token/token.module';
import { DataSource } from 'typeorm';
import { runSeeders } from 'typeorm-extension';
import { PostsModule } from './posts/posts.module';
import AppDataSource from './datasource';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: [],
          migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
          synchronize: true, // Disable in production
          logging: true,
          autoLoadEntities: true,
        };
      },
    }),
    UsersModule,
    AuthModule,
    TokenModule,
    PostsModule,
  ],
  controllers: [],
  providers: [BcryptService],
})
export class AppModule {}
