"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var JwtAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = exports.Public = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt = __importStar(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const IS_PUBLIC_KEY = 'isPublic';
const Public = () => (target, _key, descriptor) => {
    if (descriptor) {
        Reflect.defineMetadata(IS_PUBLIC_KEY, true, descriptor.value);
    }
    else {
        Reflect.defineMetadata(IS_PUBLIC_KEY, true, target);
    }
};
exports.Public = Public;
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard {
    reflector;
    logger = new common_1.Logger(JwtAuthGuard_1.name);
    client;
    issuer;
    constructor(reflector) {
        this.reflector = reflector;
        // KEYCLOAK_INTERNAL_URL: how the backend reaches Keycloak inside Docker (e.g. http://keycloak:8080)
        // KEYCLOAK_URL: the public URL the browser uses (e.g. http://localhost:8080) — must match JWT issuer
        const internalUrl = process.env.KEYCLOAK_INTERNAL_URL || process.env.KEYCLOAK_URL || 'http://localhost:8080';
        const publicUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
        const realm = process.env.KEYCLOAK_REALM || 'arex';
        this.issuer = `${publicUrl}/realms/${realm}`;
        this.client = (0, jwks_rsa_1.default)({
            jwksUri: `${internalUrl}/realms/${realm}/protocol/openid-connect/certs`,
            cache: true,
            cacheMaxAge: 600_000, // 10 minutes
            rateLimit: true,
        });
    }
    async canActivate(context) {
        // Check @Public() decorator
        const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } });
        }
        const token = authHeader.substring(7);
        try {
            const decoded = await this.verifyToken(token);
            // Extract org ID: prefer explicit org_id claim, fall back to KC Organizations object
            // KC Organizations can return either an array of aliases (KC 26 default) or
            // an object keyed by org UUID. Only use the object format as a fallback.
            let organizationId = decoded.org_id;
            if (!organizationId && decoded.organization && !Array.isArray(decoded.organization)) {
                const firstOrgId = Object.keys(decoded.organization)[0];
                if (firstOrgId)
                    organizationId = firstOrgId;
            }
            request.user = {
                keycloakId: decoded.sub,
                email: decoded.email,
                roles: decoded.realm_access?.roles || [],
                organizationId,
                username: decoded.preferred_username,
            };
            return true;
        }
        catch (error) {
            this.logger.warn(`JWT validation failed: ${error.message}`);
            throw new common_1.UnauthorizedException({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
        }
    }
    verifyToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, (header, callback) => {
                this.client.getSigningKey(header.kid, (err, key) => {
                    if (err)
                        return callback(err);
                    callback(null, key.getPublicKey());
                });
            }, {
                issuer: this.issuer,
                algorithms: ['RS256'],
            }, (err, decoded) => {
                if (err)
                    return reject(err);
                resolve(decoded);
            });
        });
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], JwtAuthGuard);
