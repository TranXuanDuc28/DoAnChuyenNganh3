import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Lumina Sign API"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # DATABASE
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "12345678" # Thay thế bằng mật khẩu thực tế nếu có
    MYSQL_SERVER: str = "localhost"
    MYSQL_PORT: str = "3306"
    MYSQL_DB: str = "sign_language_app"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_SERVER}:{self.MYSQL_PORT}/{self.MYSQL_DB}"

    class Config:
        case_sensitive = True

settings = Settings()
