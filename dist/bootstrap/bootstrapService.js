"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapService = bootstrapService;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const nestjs_pino_1 = require("nestjs-pino");
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const GlobalExceptionFilter_1 = require("../filters/GlobalExceptionFilter");
async function bootstrapService(options) {
    const { module, port, serviceName, rawBody } = options;
    const app = await core_1.NestFactory.create(module, {
        bufferLogs: true,
        ...(rawBody ? { rawBody: true } : {}),
    });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    // Security headers
    app.use((0, helmet_1.default)());
    // Cookie parsing (required for OAuth flows)
    app.use((0, cookie_parser_1.default)());
    // CORS
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Correlation-ID'],
        exposedHeaders: ['X-Correlation-ID'],
        maxAge: 86400,
    });
    // Global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter_1.GlobalExceptionFilter());
    // Global validation pipe
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    // Swagger — disabled in production
    if (process.env.NODE_ENV !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle(`AREX — ${serviceName}`)
            .setDescription(`OpenAPI spec for ${serviceName}`)
            .setVersion('1.0.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('swagger', app, document);
    }
    // Enable graceful shutdown hooks (SIGTERM, SIGINT)
    app.enableShutdownHooks();
    await app.listen(port);
    return app;
}
