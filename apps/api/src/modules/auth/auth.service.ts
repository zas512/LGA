import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { SignOptions } from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtPayload } from "./strategies/access-token.strategy";
import { UserRole } from "../../generated/prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.ADMIN || dto.role === UserRole.ASSOCIATE) {
      throw new ForbiddenException(
        "Self-registration is disabled for ADMIN and ASSOCIATE roles. Firm administrators must create team member accounts."
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    if (existing) {
      throw new ConflictException("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    if (dto.role === UserRole.OWNER) {
      if (!dto.firmName) {
        throw new BadRequestException(
          "firmName is required when registering a Firm Owner"
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const firm = await tx.firm.create({
          data: { name: dto.firmName! }
        });
        const user = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            role: UserRole.OWNER,
            firmId: firm.id
          }
        });
        return user;
      });

      const tokens = await this.issueTokens({
        sub: result.id,
        email: result.email,
        role: result.role,
        firmId: result.firmId
      });
      await this.saveRefreshTokenHash(result.id, tokens.refreshToken);
      return tokens;
    }

    // SUPER_ADMIN
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        firmId: null
      }
    });

    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      firmId: user.firmId
    });
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    console.log("user in backend: ", user);
    if (!user?.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash
    );
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      firmId: user.firmId
    });
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("Access denied");
    }
    const storedRefreshTokenHash = (user as { refreshTokenHash?: unknown })
      .refreshTokenHash;
    if (typeof storedRefreshTokenHash !== "string" || !storedRefreshTokenHash) {
      throw new UnauthorizedException("Access denied");
    }
    const tokenMatches = await bcrypt.compare(
      refreshToken,
      storedRefreshTokenHash
    );
    if (!tokenMatches) {
      throw new UnauthorizedException("Access denied");
    }
    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      firmId: user.firmId
    });
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null }
    });
  }

  private async issueTokens(payload: JwtPayload) {
    const accessSecret = this.getEnv("JWT_ACCESS_SECRET");
    const refreshSecret = this.getEnv("JWT_REFRESH_SECRET");
    const accessExpiresIn = this.getJwtExpiresIn("JWT_ACCESS_EXPIRES_IN");
    const refreshExpiresIn = this.getJwtExpiresIn("JWT_REFRESH_EXPIRES_IN");
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn
      })
    ]);
    return { accessToken, refreshToken };
  }

  private getEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new UnauthorizedException(`Missing environment variable: ${key}`);
    }
    return value;
  }

  private getJwtExpiresIn(key: string): NonNullable<SignOptions["expiresIn"]> {
    const value = this.getEnv(key);
    if (/^\d+$/.test(value)) {
      return Number(value);
    }
    return value as NonNullable<SignOptions["expiresIn"]>;
  }

  private async saveRefreshTokenHash(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash }
    });
  }
}
