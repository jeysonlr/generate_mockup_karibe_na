import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'karibe-secret-change-in-production',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const admin = await this.authService.validateAdmin(payload.sub);
    if (!admin || !admin.isActive) return null;
    return { id: admin.id, email: admin.email, name: admin.name };
  }
}
