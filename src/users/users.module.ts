import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { OAuthAccount } from './entities/oauth-account.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, OAuthAccount])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
