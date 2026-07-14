import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { OAuthAccount, OAuthProvider } from './entities/oauth-account.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import {
  BusinessProfile,
  Workspace,
  WorkspaceMember,
} from '../database/entities/workspace.entity';
import {
  OnboardingStatus,
  WorkspaceMemberStatus,
  WorkspaceRole,
  WorkspaceStatus,
} from '../database/entities/enums';

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
    private readonly dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto, passwordHash: string) {
    const existingUser = await this.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: createUserDto.email.toLowerCase(),
        passwordHash,
        displayName: createUserDto.displayName,
      });

      await manager.save(user);
      await this.createPersonalWorkspace(manager, user);
      return user;
    });
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
    const user = await this.findByEmail(email);

    if (user && !profile.emailVerified) {
      throw new ConflictException(
        'An account with this email already exists and the provider email is not verified',
      );
    }

    if (!user) {
      return this.dataSource.transaction(async (manager) => {
        const newUser = manager.create(User, {
          email,
          displayName: profile.displayName,
        });

        await manager.save(newUser);
        await this.createPersonalWorkspace(manager, newUser);
        await manager.save(
          manager.create(OAuthAccount, {
            provider: profile.provider,
            providerId: profile.providerId,
            email,
            userId: newUser.id,
          }),
        );

        return newUser;
      });
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
    await this.usersRepository.softRemove(user);
    return { deleted: true };
  }

  async purgeNewlyCreatedUser(id: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Workspace, { createdById: id });
      await manager.delete(User, { id });
    });
  }

  private async createPersonalWorkspace(manager: EntityManager, user: User) {
    const label = user.displayName?.trim() || user.email.split('@')[0];
    const workspace = manager.create(Workspace, {
      name: `${label}의 워크스페이스`,
      slug: `personal-${user.id}`,
      status: WorkspaceStatus.ACTIVE,
      defaultCurrency: 'KRW',
      timezone: 'Asia/Seoul',
      createdById: user.id,
    });

    await manager.save(workspace);
    await manager.save(
      manager.create(WorkspaceMember, {
        workspaceId: workspace.id,
        userId: user.id,
        role: WorkspaceRole.OWNER,
        status: WorkspaceMemberStatus.ACTIVE,
        joinedAt: new Date(),
      }),
    );
    await manager.save(
      manager.create(BusinessProfile, {
        workspaceId: workspace.id,
        onboardingStatus: OnboardingStatus.NOT_STARTED,
      }),
    );
  }
}
