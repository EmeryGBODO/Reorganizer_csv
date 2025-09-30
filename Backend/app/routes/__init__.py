from fastapi import FastAPI
from app.api.endpoints.auth import login_for_access_token

def include_routers(app: FastAPI):
    app.include_router(login_for_access_token, prefix="/api")
    