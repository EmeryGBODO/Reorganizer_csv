from fastapi import FastAPI
from app.api.endpoints import auth
from app.routes import campaign_routes

def include_routers(app: FastAPI):
    app.include_router(auth.router, prefix="/api")
    app.include_router(campaign_routes.router, prefix="/api")
    