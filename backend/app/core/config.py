import os
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

# Thư mục backend/ (cùng cấp với database.py)
_BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(_BACKEND_ROOT, ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Lumina Sign API"

    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # Trùng mặc định với database.DatabaseManager (hybrid server)
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "123456789" # Thay thế bằng mật khẩu thực tế nếu có
    MYSQL_SERVER: str = "localhost"
    MYSQL_PORT: str = "3306"
    MYSQL_DB: str = "dacn3"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        user = quote_plus(self.MYSQL_USER)
        password = quote_plus(self.MYSQL_PASSWORD)
        return (
            f"mysql+pymysql://{user}:{password}@{self.MYSQL_SERVER}:"
            f"{self.MYSQL_PORT}/{self.MYSQL_DB}"
        )


settings = Settings()
