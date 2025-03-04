import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersTableAddedTokenVersionField1741109811074 implements MigrationInterface {
    name = 'UsersTableAddedTokenVersionField1741109811074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "tokenVersion" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tokenVersion"`);
    }

}
