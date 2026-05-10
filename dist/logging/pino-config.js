"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPinoConfig = createPinoConfig;
function canResolvePinoSeq() {
    try {
        require.resolve('pino-seq');
        return true;
    }
    catch {
        return false;
    }
}
function buildTransport(logLevel) {
    const seqUrl = process.env['SEQ_URL'];
    const useSeq = seqUrl && canResolvePinoSeq();
    if (process.env['NODE_ENV'] === 'production' && useSeq) {
        return {
            target: 'pino-seq',
            options: { serverUrl: seqUrl, logOtherAs: 'Verbose' },
        };
    }
    const targets = [
        { target: 'pino/file', options: { destination: 1 }, level: logLevel },
    ];
    if (useSeq) {
        targets.push({
            target: 'pino-seq',
            options: { serverUrl: seqUrl, logOtherAs: 'Verbose' },
            level: logLevel,
        });
    }
    return { targets };
}
function createPinoConfig(serviceName) {
    const logLevel = process.env['LOG_LEVEL'] || 'info';
    return {
        pinoHttp: {
            level: logLevel,
            transport: buildTransport(logLevel),
            serializers: {
                req(req) {
                    return {
                        id: req.id,
                        method: req.method,
                        url: req.url,
                        correlationId: req.raw?.correlationId || req.headers?.['x-correlation-id'],
                    };
                },
                res(res) {
                    return {
                        statusCode: res.statusCode,
                    };
                },
                email(value) {
                    if (!value || typeof value !== 'string')
                        return value;
                    const [local, domain] = value.split('@');
                    if (!domain)
                        return value;
                    return `${local[0]}***@${domain}`;
                },
                token(_value) {
                    return '[REDACTED]';
                },
                brd(value) {
                    if (!value || typeof value !== 'string')
                        return value;
                    return value.length > 50 ? `${value.substring(0, 50)}...` : value;
                },
            },
            customProps(req) {
                return {
                    correlationId: req.correlationId || req.headers?.['x-correlation-id'],
                    service: serviceName,
                };
            },
        },
    };
}
