export type TechStackType = 'NestJs' | 'DotNet';
export type DatabaseTypeValue = 'MongoDB' | 'PostgreSql' | 'SqlServer' | 'MySql';
interface OrmEntry {
    ormName: string;
    ormPackage: string;
    migrationCommand: string;
}
/**
 * StackProfile provides all technology-specific strings for AI prompts
 * and code generators, parameterized by TechStack × DatabaseType.
 */
export declare class StackProfile {
    /**
     * ORM matrix: TechStack × DatabaseType → ORM details
     *
     * NestJs + PostgreSql → TypeORM
     * NestJs + MongoDB → Mongoose 8
     * NestJs + SqlServer → TypeORM
     * NestJs + MySql → TypeORM
     * DotNet + PostgreSql → EF Core + Npgsql
     * DotNet + MongoDB → MongoDB.Driver
     * DotNet + SqlServer → EF Core
     * DotNet + MySql → EF Core + Pomelo
     */
    static readonly ORM_MATRIX: Record<TechStackType, Record<DatabaseTypeValue, OrmEntry>>;
    readonly techStack: TechStackType;
    readonly databaseType: DatabaseTypeValue;
    constructor(techStack: TechStackType, databaseType: DatabaseTypeValue);
    get ormName(): string;
    get ormPackage(): string;
    get migrationCommand(): string;
    get backendFramework(): string;
    get backendLanguage(): string;
    get isDocumentDb(): boolean;
    get databaseDriver(): string;
}
export {};
