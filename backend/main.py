from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api_v1.user_operation_views import router as user_router
from app.api_v1.auth_veiws import router as OAuth_jwt_router
from app.api_v1.posts_veiws import router as posts_router
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(user_router)
app.include_router(OAuth_jwt_router)
app.include_router(posts_router)

if __name__ == "__main__":
    uvicorn.run("main:app",reload=True)