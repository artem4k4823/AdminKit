from fastapi import FastAPI
from sqladmin import Admin
from app.core.database import db
from app.core.admin_auth import AdminAuth
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.core.models.admin import UserAdmin
from app.core.models.admin import PostAdmin
from app.core.models.admin import MessageAdmin

from app.api_v1.user_operation_views import router as user_router
from app.api_v1.auth_veiws import router as OAuth_jwt_router
from app.api_v1.posts_veiws import router as posts_router
from app.api_v1.chat_veiws import router as chat_router
from app.api_v1.comment_veiws import router as comment_router
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="app/static"), name="static")
admin = Admin(app, engine=db.engine, authentication_backend = AdminAuth(secret_key=settings.SECRET_KEY))

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
app.include_router(chat_router)
app.include_router(comment_router)

admin.add_view(UserAdmin)
admin.add_view(PostAdmin)
admin.add_view(MessageAdmin)

authentication_backend = AdminAuth(secret_key=settings.SECRET_KEY)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000,reload=True)