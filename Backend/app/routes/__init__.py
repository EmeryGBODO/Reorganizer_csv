from fastapi import FastAPI
from app.routes import auth
from app.routes import campaign_routes
from app.routes import reorganizer_routes

def include_routers(app: FastAPI):
    app.include_router(auth.router, prefix="/api")
    app.include_router(campaign_routes.router, prefix="/api")
    app.include_router(reorganizer_routes.router, prefix="/api", tags=["files"])