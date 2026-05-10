export declare function createPinoConfig(serviceName: string): {
    pinoHttp: {
        level: string;
        transport: {
            target: string;
            options: {
                serverUrl: string;
                logOtherAs: string;
            };
            targets?: undefined;
        } | {
            targets: any[];
            target?: undefined;
            options?: undefined;
        };
        serializers: {
            req(req: any): {
                id: any;
                method: any;
                url: any;
                correlationId: any;
            };
            res(res: any): {
                statusCode: any;
            };
            email(value: string): string;
            token(_value: string): string;
            brd(value: string): string;
        };
        customProps(req: any): {
            correlationId: any;
            service: string;
        };
    };
};
