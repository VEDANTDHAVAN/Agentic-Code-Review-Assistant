"""initial production schema

Revision ID: 20260525_0001
Revises:
Create Date: 2026-05-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260525_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_connections",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("provider_user_id", sa.String(length=255), nullable=True),
        sa.Column("login", sa.String(length=255), nullable=True),
        sa.Column("encrypted_token", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", "provider", name="uq_user_connections_user_provider"),
    )
    op.create_index("ix_user_connections_user_id", "user_connections", ["user_id"])

    op.create_table(
        "review_jobs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("owner", sa.String(length=255), nullable=False),
        sa.Column("repo", sa.String(length=255), nullable=False),
        sa.Column("pr_number", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "findings",
        sa.Column("id", sa.String(length=128), primary_key=True),
        sa.Column("job_id", sa.String(length=64), sa.ForeignKey("review_jobs.id"), nullable=False),
        sa.Column("agent", sa.String(length=128), nullable=False),
        sa.Column("file_path", sa.Text(), nullable=True),
        sa.Column("line_number", sa.Integer(), nullable=True),
        sa.Column("severity", sa.String(length=32), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("suggestion", sa.Text(), nullable=False),
        sa.Column("code_snippet", sa.Text(), nullable=True),
        sa.Column("approved", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("posted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
    )
    op.create_index("ix_findings_job_id", "findings", ["job_id"])

    op.create_table(
        "logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("job_id", sa.String(length=64), sa.ForeignKey("review_jobs.id"), nullable=False),
        sa.Column("type", sa.String(length=64), nullable=False),
        sa.Column("agent", sa.String(length=128), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_logs_job_id", "logs", ["job_id"])

    op.create_table(
        "oauth_sessions",
        sa.Column("session_id", sa.String(length=128), primary_key=True),
        sa.Column("github_user_id", sa.Integer(), nullable=False),
        sa.Column("login", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("html_url", sa.Text(), nullable=True),
        sa.Column("encrypted_token", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "user_ai_keys",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("encrypted_key", sa.Text(), nullable=False),
        sa.Column("masked_key", sa.String(length=64), nullable=False),
        sa.Column("default_model", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", "provider", name="uq_user_ai_keys_user_provider"),
    )
    op.create_index("ix_user_ai_keys_user_id", "user_ai_keys", ["user_id"])

    op.create_table(
        "connected_repositories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("owner", sa.String(length=255), nullable=False),
        sa.Column("repo", sa.String(length=255), nullable=False),
        sa.Column("installation_id", sa.String(length=255), nullable=True),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", "owner", "repo", name="uq_connected_repositories_user_repo"),
    )
    op.create_index("ix_connected_repositories_user_id", "connected_repositories", ["user_id"])

    op.create_table(
        "repo_memory_chunks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("repo_id", sa.Integer(), sa.ForeignKey("connected_repositories.id"), nullable=True),
        sa.Column("owner", sa.String(length=255), nullable=False),
        sa.Column("repo", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("repo_memory_chunks")
    op.drop_index("ix_connected_repositories_user_id", table_name="connected_repositories")
    op.drop_table("connected_repositories")
    op.drop_index("ix_user_ai_keys_user_id", table_name="user_ai_keys")
    op.drop_table("user_ai_keys")
    op.drop_table("oauth_sessions")
    op.drop_index("ix_logs_job_id", table_name="logs")
    op.drop_table("logs")
    op.drop_index("ix_findings_job_id", table_name="findings")
    op.drop_table("findings")
    op.drop_table("review_jobs")
    op.drop_index("ix_user_connections_user_id", table_name="user_connections")
    op.drop_table("user_connections")
