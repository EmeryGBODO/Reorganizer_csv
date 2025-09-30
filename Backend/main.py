from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routes import include_routers

# Configuration CORS - Liste des origines autorisées
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Configuration des méthodes HTTP autorisées
ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]

# Configuration des en-têtes autorisés
ALLOWED_HEADERS = [
    "Accept",
    "Accept-Language",
    "Content-Language",
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Mode"
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestionnaire de cycle de vie de l'application.

    Args:
        app: Instance de FastAPI

    Yields:
        None: Pendant l'exécution de l'application
    """
    try:
        # Démarrage de l'application
        await startup_event()
        print("✅ Application démarrée - Événements de démarrage exécutés")
        yield

    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {e}")
        raise

    finally:
        # Arrêt de l'application - Nettoyage des ressources
        try:
            await engine.dispose()
            # ----------------------------
            # Arrêt propre du scheduler à la fermeture
            # ----------------------------
            atexit.register(lambda: scheduler.shutdown())
            print("✅ Connexion à la base de données fermée avec succès")
        except Exception as e:
            print(f"⚠️  Avertissement lors de la fermeture de la base de données: {e}")


def create_application() -> FastAPI:
    """
    Factory function pour créer et configurer l'application FastAPI.

    Returns:
        FastAPI: Application configurée
    """
    # Création de l'application avec métadonnées
    app = FastAPI(
        title="REORGANIZER CSV",
        version="1.0.0",
        description="API pour l'application Reorganizer csv",
        docs_url="/api/docs",  # Documentation Swagger
        redoc_url="/api/redoc",  # Documentation Redoc
    )

    # Configuration des routes
    configure_routes(app)

    return app


def configure_routes(app: FastAPI) -> None:
    """
    Configure les routes de l'application.

    Args:
        app: Instance FastAPI à configurer
    """

    # Route health check de base
    @app.get("/", tags=["Health Check"])
    async def root() -> dict:
        """
        Endpoint de santé de l'API.

        Returns:
            dict: Message de confirmation du fonctionnement
        """
        return {
            "message": "Reorganizer api is running",
            "version": "1.0.0",
            "status": "healthy",
        }

    include_routers(app)


# Création de l'application
app = create_application()

# Point d'entrée pour l'exécution en tant que script
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
