import os
from dotenv import load_dotenv

load_dotenv()

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "une_cle_secrete_tres_difficile_a_deviner_en_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Durée de vie du jeton d'accès
REFRESH_TOKEN_EXPIRE_DAYS = 7   # Durée de vie du jeton de rafraîchissement