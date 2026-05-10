import { INestApplication } from '@nestjs/common';
export interface BootstrapOptions {
    module: any;
    port: number;
    serviceName: string;
    rawBody?: boolean;
}
export declare function bootstrapService(options: BootstrapOptions): Promise<INestApplication>;
