import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { SignOptions } from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { toEntity } from "../../common/serialization/serialize";
import type { EnvironmentVariables } from "../../config/env.validation";
import { UserRole } from "../../generated/prisma/client";
import { BCRYPT_ROUNDS } from "./auth.constants";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthUserEntity } from "./entities/auth.entity";
import type { JwtPayload } from "./strategies/access-token.strategy";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>
  ) {}

  /**
   * Self-registration creates a firm OWNER and their firm, nothing else.
   *
   * ADMIN/ASSOCIATE accounts are created by a firm administrator, and
   * SUPER_ADMIN accounts are provisioned out of band (see `prisma/seed.ts`) —
   * the previous implementation fell through to a SUPER_ADMIN branch, so any
   * unauthenticated caller could mint a platform administrator.
   */
  async register(dto: RegisterDto): Promise<AuthTokens> {
    if (dto.role !== UserRole.OWNER) {
      throw new ForbiddenException(
        "Self-registration is only available for firm owners. Other accounts must be created by an administrator."
      );
    }
    if (!dto.firmName) {
      throw new BadRequestException(
        "firmName is required when registering a firm owner"
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true }
    });
    if (existing) {
      throw new ConflictException("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const firmName = dto.firmName;

    const user = await this.prisma.$transaction(async (tx) => {
      const firm = await tx.firm.create({ data: { name: firmName } });
      return tx.user.create({
        data: {
          email: dto.email,
          name: dto.name ?? null,
          passwordHash,
          role: UserRole.OWNER,
          firmId: firm.id
        }
      });
    });

    return this.issueAndPersistTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    // Compare against a throwaway hash for unknown accounts so the response
    // time does not reveal whether an email is registered.
    const passwordMatches = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : await bcrypt.compare(dto.password, DUMMY_HASH);

    if (!user || !user.isActive || !passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.issueAndPersistTokens(user);
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException("Access denied");
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash
    );
    if (!tokenMatches) {
      throw new UnauthorizedException("Access denied");
    }

    return this.issueAndPersistTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null }
    });
  }

  async getMe(payload: JwtPayload): Promise<AuthUserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        firmId: true,
        isActive: true,
        associateId: true
      }
    });

    if (!user?.isActive) {
      throw new UnauthorizedException();
    }

    const isCheckedIn = user.associateId
      ? (await this.prisma.attendance.count({
          where: { associateId: user.associateId, checkOut: null }
        })) > 0
      : false;

    return toEntity(AuthUserEntity, {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      firmId: user.firmId,
      associateId: user.associateId,
      isCheckedIn
    });
  }

  private async issueAndPersistTokens(user: {
    id: string;
    email: string;
    role: UserRole;
    firmId: string | null;
    name: string | null;
  }): Promise<AuthTokens> {
    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      firmId: user.firmId,
      name: user.name
    });
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  private async issueTokens(payload: JwtPayload): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
        expiresIn: this.expiresIn("JWT_ACCESS_EXPIRES_IN")
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get("JWT_REFRESH_SECRET", { infer: true }),
        expiresIn: this.expiresIn("JWT_REFRESH_EXPIRES_IN")
      })
    ]);
    return { accessToken, refreshToken };
  }

  private expiresIn(
    key: "JWT_ACCESS_EXPIRES_IN" | "JWT_REFRESH_EXPIRES_IN"
  ): NonNullable<SignOptions["expiresIn"]> {
    const value = this.config.get(key, { infer: true });
    // "3600" means seconds, "15m" is a duration string; jsonwebtoken needs the
    // former as a number.
    return /^\d+$/.test(value)
      ? Number(value)
      : (value as NonNullable<SignOptions["expiresIn"]>);
  }

  private async saveRefreshTokenHash(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash }
    });
  }
}

/** bcrypt hash of a value no user can supply; only used to equalise timing. */
const DUMMY_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
