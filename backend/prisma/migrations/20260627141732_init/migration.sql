-- CreateEnum
CREATE TYPE "InteractionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'RETRYING');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SAVE_INTERACTION', 'AI_STARTED', 'AI_COMPLETED', 'MIRROR_SENT', 'DISCORD_REPLY_SENT', 'RETRY', 'FAILURE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "supabase_user_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servers" (
    "id" UUID NOT NULL,
    "discord_guild_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_configs" (
    "id" UUID NOT NULL,
    "server_id" UUID NOT NULL,
    "mirror_channel_id" BIGINT,
    "default_command_channel_id" BIGINT,
    "logging_enabled" BOOLEAN NOT NULL DEFAULT true,
    "ai_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "server_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "command_configs" (
    "id" UUID NOT NULL,
    "server_id" UUID NOT NULL,
    "command_name" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ai_enabled" BOOLEAN NOT NULL DEFAULT true,
    "mirror_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "command_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_logs" (
    "id" UUID NOT NULL,
    "interaction_id" VARCHAR(100) NOT NULL,
    "server_id" UUID NOT NULL,
    "discord_user_id" BIGINT NOT NULL,
    "command" VARCHAR(100) NOT NULL,
    "arguments" JSONB,
    "status" "InteractionStatus" NOT NULL,
    "ai_summary" VARCHAR(1000),
    "ai_tags" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_logs" (
    "id" UUID NOT NULL,
    "interaction_log_id" UUID NOT NULL,
    "action_type" "ActionType" NOT NULL,
    "status" "ActionStatus" NOT NULL,
    "provider" VARCHAR(100),
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_user_id_key" ON "users"("supabase_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "servers_discord_guild_id_key" ON "servers"("discord_guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "server_configs_server_id_key" ON "server_configs"("server_id");

-- CreateIndex
CREATE INDEX "command_configs_server_id_idx" ON "command_configs"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "command_configs_server_id_command_name_key" ON "command_configs"("server_id", "command_name");

-- CreateIndex
CREATE UNIQUE INDEX "interaction_logs_interaction_id_key" ON "interaction_logs"("interaction_id");

-- CreateIndex
CREATE INDEX "interaction_logs_server_id_idx" ON "interaction_logs"("server_id");

-- CreateIndex
CREATE INDEX "interaction_logs_command_idx" ON "interaction_logs"("command");

-- CreateIndex
CREATE INDEX "interaction_logs_created_at_idx" ON "interaction_logs"("created_at");

-- CreateIndex
CREATE INDEX "action_logs_interaction_log_id_idx" ON "action_logs"("interaction_log_id");

-- CreateIndex
CREATE INDEX "action_logs_created_at_idx" ON "action_logs"("created_at");

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_configs" ADD CONSTRAINT "server_configs_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "command_configs" ADD CONSTRAINT "command_configs_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_logs" ADD CONSTRAINT "interaction_logs_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_interaction_log_id_fkey" FOREIGN KEY ("interaction_log_id") REFERENCES "interaction_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
