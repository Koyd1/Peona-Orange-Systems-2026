from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    web_origin: str = "http://localhost:3000"
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "CHANGE_ME"
    minio_bucket: str = "hrbot-documents"
    minio_use_ssl: bool = False
    redis_url: str = "redis://localhost:6379/0"
    openai_api_key: str = ""
    ingest_tmp_dir: str = "/tmp/rag"
    ingest_max_file_size_mb: int = 15
    openai_chat_model: str = "gpt-4o"
    openai_chat_fallback_models: str = "gpt-4o"
    openai_judge_model: str = "gpt-4o"
    rag_top_k: int = 5
    rag_sim_threshold: float = 0.05
    health_openai_warn_ms: int = 1800
    health_hall_warn_threshold: float = 0.45

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
