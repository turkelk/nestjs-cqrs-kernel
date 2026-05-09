"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackProfile = void 0;
/**
 * StackProfile provides all technology-specific strings for AI prompts
 * and code generators, parameterized by TechStack × DatabaseType.
 */
class StackProfile {
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
    static ORM_MATRIX = {
        NestJs: {
            PostgreSql: { ormName: 'TypeORM', ormPackage: 'typeorm', migrationCommand: 'npx typeorm migration:generate' },
            MongoDB: { ormName: 'Mongoose 8', ormPackage: 'mongoose', migrationCommand: 'npx migrate-mongo create' },
            SqlServer: { ormName: 'TypeORM', ormPackage: 'typeorm', migrationCommand: 'npx typeorm migration:generate' },
            MySql: { ormName: 'TypeORM', ormPackage: 'typeorm', migrationCommand: 'npx typeorm migration:generate' },
        },
        DotNet: {
            PostgreSql: { ormName: 'EF Core + Npgsql', ormPackage: 'Npgsql.EntityFrameworkCore.PostgreSQL', migrationCommand: 'dotnet ef migrations add' },
            MongoDB: { ormName: 'MongoDB.Driver', ormPackage: 'MongoDB.Driver', migrationCommand: '' },
            SqlServer: { ormName: 'EF Core', ormPackage: 'Microsoft.EntityFrameworkCore.SqlServer', migrationCommand: 'dotnet ef migrations add' },
            MySql: { ormName: 'EF Core + Pomelo', ormPackage: 'Pomelo.EntityFrameworkCore.MySql', migrationCommand: 'dotnet ef migrations add' },
        },
    };
    techStack;
    databaseType;
    constructor(techStack, databaseType) {
        this.techStack = techStack;
        this.databaseType = databaseType;
    }
    get ormName() {
        return StackProfile.ORM_MATRIX[this.techStack][this.databaseType].ormName;
    }
    get ormPackage() {
        return StackProfile.ORM_MATRIX[this.techStack][this.databaseType].ormPackage;
    }
    get migrationCommand() {
        return StackProfile.ORM_MATRIX[this.techStack][this.databaseType].migrationCommand;
    }
    get backendFramework() {
        return this.techStack === 'NestJs' ? 'NestJS 11' : '.NET 8';
    }
    get backendLanguage() {
        return this.techStack === 'NestJs' ? 'TypeScript' : 'C#';
    }
    get isDocumentDb() {
        return this.databaseType === 'MongoDB';
    }
    get databaseDriver() {
        switch (this.databaseType) {
            case 'PostgreSql': return this.techStack === 'NestJs' ? 'pg' : 'Npgsql';
            case 'MongoDB': return this.techStack === 'NestJs' ? 'mongodb' : 'MongoDB.Driver';
            case 'SqlServer': return this.techStack === 'NestJs' ? 'mssql' : 'Microsoft.Data.SqlClient';
            case 'MySql': return this.techStack === 'NestJs' ? 'mysql2' : 'MySqlConnector';
        }
    }
}
exports.StackProfile = StackProfile;
//# sourceMappingURL=StackProfile.js.map