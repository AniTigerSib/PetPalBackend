import { MigrationInterface, QueryRunner } from "typeorm";

export class ProfileMovedIntoUserField1750341408108 implements MigrationInterface {
    name = 'ProfileMovedIntoUserField1750341408108'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_9466682df91534dd95e4dbaa616"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "REL_9466682df91534dd95e4dbaa61"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "profileId"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "phone" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "profileImage" text`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bio" text`);
        await queryRunner.query(`DROP TABLE "profile"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_9466682df91534dd95e4dbaa616"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_9466682df91534dd95e4dbaa616"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "profileId"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "profileImage"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phone"`);
        await queryRunner.query(`CREATE TABLE "profile" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "phone" character varying(20), "profileImage" text, "bio" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id"))`);
    }

}
