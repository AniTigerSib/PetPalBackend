import { MigrationInterface, QueryRunner } from "typeorm";

export class TokensAndOauthTablesCreated1740057307614 implements MigrationInterface {
    name = 'TokensAndOauthTablesCreated1740057307614'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_token" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "token" text NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "UQ_c31d0a2f38e6e99110df62ab0af" UNIQUE ("token"), CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "oauth_account" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "provider" character varying(50) NOT NULL, "providerUserId" character varying(255) NOT NULL, "accessToken" text, "refreshToken" text, "expiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_01ec7d2a8273dcaaed3dd10a4fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "oauth_account" ADD CONSTRAINT "FK_a9124d5956d6244b17bdd67f92b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "oauth_account" DROP CONSTRAINT "FK_a9124d5956d6244b17bdd67f92b"`);
        await queryRunner.query(`ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_8e913e288156c133999341156ad"`);
        await queryRunner.query(`DROP TABLE "oauth_account"`);
        await queryRunner.query(`DROP TABLE "refresh_token"`);
    }

}
