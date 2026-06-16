import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthAccount, OAuthProvider } from './entities/oauth-account.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

export type OAuthProfile = {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(OAuthAccount)
    private readonly oauthAccountsRepository: Repository<OAuthAccount>,
  ) {}

  async create(createUserDto: CreateUserDto, passwordHash: string) {
    const existingUser = await this.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.usersRepository.create({
      email: createUserDto.email.toLowerCase(),
      passwordHash,
      displayName: createUserDto.displayName,
    });

    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: string) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  findByEmailWithPassword(email: string) {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'passwordHash', 'displayName'],
    });
  }

  async findOrCreateOAuthUser(profile: OAuthProfile) {
    if (!profile.email) {
      throw new ConflictException(
        `${profile.provider} did not provide an email address`,
      );
    }

    const account = await this.oauthAccountsRepository.findOne({
      where: {
        provider: profile.provider,
        providerId: profile.providerId,
      },
      relations: ['user'],
    });

    if (account) {
      return account.user;
    }

    const email = profile.email.toLowerCase();
    let user = await this.findByEmail(email);

    if (user && !profile.emailVerified) {
      throw new ConflictException(
        'An account with this email already exists and the provider email is not verified',
      );
    }

    if (!user) {
      user = await this.usersRepository.save(
        this.usersRepository.create({
          email,
          displayName: profile.displayName,
        }),
      );
    }

    await this.oauthAccountsRepository.save(
      this.oauthAccountsRepository.create({
        provider: profile.provider,
        providerId: profile.providerId,
        email,
        userId: user.id,
      }),
    );

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (updateUserDto.email) {
      user.email = updateUserDto.email.toLowerCase();
    }
    if (updateUserDto.displayName !== undefined) {
      user.displayName = updateUserDto.displayName;
    }
    return this.usersRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
    return { deleted: true };
  }
}
