import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

export interface JwtPayload {
  sub: string;
  email: string;
  realm_access?: { roles: string[] };
  preferred_username?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const internalUrl = process.env.KEYCLOAK_INTERNAL_URL || process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const publicUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.KEYCLOAK_REALM || 'arex';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        jwksUri: `${internalUrl}/realms/${realm}/protocol/openid-connect/certs`,
        cache: true,
        cacheMaxAge: 600_000,
        rateLimit: true,
      }),
      issuer: `${publicUrl}/realms/${realm}`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload) {
    return {
      keycloakId: payload.sub,
      email: payload.email,
      roles: payload.realm_access?.roles || [],
      username: payload.preferred_username,
    };
  }
}
