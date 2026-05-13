import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          // Check cookie first
          if (req?.cookies?.access_token) {
            return req.cookies.access_token;
          }
          // Then check Authorization header
          if (req?.headers?.authorization?.startsWith('Bearer ')) {
            return req.headers.authorization.split(' ')[1];
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') as string,
    } as any);
  }

  async validate(payload: any): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      ...user,
      permissions: this.getPermissions(user.role),
    };
  }

  private getPermissions(role: string): string[] {
    // Base permissions for all authenticated users
    const basePermissions = [
      'task:read',
      'goal:read',
      'habit:read',
      'note:read',
      'schedule:read',
      'dashboard:read',
    ];

    // Additional permissions based on role
    if (role === 'ADMIN') {
      return [
        ...basePermissions,
        'user:read',
        'user:update',
        'user:delete',
        'admin:read_all',
        'admin:update_any',
        'admin:delete_any',
      ];
    }

    // USER role gets full CRUD on own resources
    return [
      ...basePermissions,
      'task:create',
      'task:update',
      'task:delete',
      'goal:create',
      'goal:update',
      'goal:delete',
      'habit:create',
      'habit:update',
      'habit:delete',
      'note:create',
      'note:update',
      'note:delete',
      'schedule:create',
      'schedule:update',
      'schedule:delete',
    ];
  }
}