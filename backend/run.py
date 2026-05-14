import uvicorn
import os
from dotenv import load_dotenv

# Nạp biến môi trường từ file .env
load_dotenv()

if __name__ == "__main__":
    # Khởi chạy server với auto-reload khi code thay đổi
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        forwarded_allow_ips="*"
    )
