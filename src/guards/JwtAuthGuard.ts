import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => (target: object, _key?: string | symbol, descriptor?: PropertyDescriptor) => {
  if (descriptor) {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, descriptor.value!);
  } else {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, target);
  }
};

export interface JwtPayload {
  sub: string;
  email: string;
  realm_access?: { roles: string[] };
  org_id?: string;
  organization?: Record<string, { id?: string; [key: string]: unknown }>;
  preferred_username?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly client: jwksClient.JwksClient;
  private readonly issuer: string;

  constructor(private readonly reflector: Reflector) {
    // KEYCLOAK_INTERNAL_URL: how the backend reaches Keycloak inside Docker (e.g. http://keycloak:8080)
    // KEYCLOAK_URL: the public URL the browser uses (e.g. http://localhost:8080) — must match JWT issuer
    const internalUrl = process.env.KEYCLOAK_INTERNAL_URL || process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const publicUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.KEYCLOAK_REALM || 'arex';

    this.issuer = `${publicUrl}/realms/${realm}`;

    this.client = jwksClient({
      jwksUri: `${internalUrl}/realms/${realm}/protocol/openid-connect/certs`,
      cache: true,
      cacheMaxAge: 600_000, // 10 minutes
      rateLimit: true,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = await this.verifyToken(token);

      // Extract org from KC Organizations claim (preferred) or legacy org_id attribute
      let organizationId = decoded.org_id;
      if (decoded.organization) {
        const firstOrg = Object.values(decoded.organization)[0];
        if (firstOrg?.id) organizationId = firstOrg.id;
      }

      request.user = {
        keycloakId: decoded.sub,
        email: decoded.email,
        roles: decoded.realm_access?.roles || [],
        organizationId,
        username: decoded.preferred_username,
      };
      return true;
    } catch (error) {
      this.logger.warn(`JWT validation failed: ${(error as Error).message}`);
      throw new UnauthorizedException({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
    }
  }

  private verifyToken(token: string): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        (header, callback) => {
          this.client.getSigningKey(header.kid!, (err, key) => {
            if (err) return callback(err);
            callback(null, key!.getPublicKey());
          });
        },
        {
          issuer: this.issuer,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded as unknown as JwtPayload);
        },
      );
    });
  }
}
