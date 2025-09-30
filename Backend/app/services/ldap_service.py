import logging
from ldap3 import ALL, SIMPLE, Connection, Server
from ldap3.utils.conv import escape_filter_chars
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import User, LdapConfig
from app.database.database import get_session, get_engine
from app.utils.security import hash_password

logger = logging.getLogger(__name__)

async def verify_ldap_user_exists(ldap_login: str, db: AsyncSession) -> bool:
    """
    Vérifie qu'un utilisateur existe dans le serveur LDAP sans authentification
    """
    try:
        # Récupération de la configuration LDAP
        result = await db.execute(
            select(LdapConfig).where(LdapConfig.name == "CHEM_AUTHENTICATION")
        )
        ldap_config = result.scalars().first()

        if not ldap_config:
            logger.error("Configuration LDAP introuvable")
            return False

        # Configuration du serveur LDAP
        server = Server(
            host=ldap_config.host,
            port=ldap_config.port,
            get_info=ALL,
            use_ssl=False
        )

        # Connexion avec un compte de service pour recherche
        with Connection(
            server,
            user=f"{ldap_config.bind_dn}",
            password=ldap_config.bind_password,
            authentication=SIMPLE,
            auto_bind=True
        ) as conn:
            
            # Recherche de l'utilisateur (sécurisée contre injection LDAP)
            escaped_login = escape_filter_chars(ldap_login)
            search_filter = f"(sAMAccountName={escaped_login})"
            conn.search(
                search_base=ldap_config.base_dn,
                search_filter=search_filter,
                attributes=['cn', 'sAMAccountName', 'mail']
            )
            
            return len(conn.entries) > 0

    except Exception as e:
        logger.error(f"Erreur lors de la vérification LDAP: {e}")
        return False

async def authenticate_ldap(user: User, password: str, db: AsyncSession) -> bool:
    """
    Authentifie un utilisateur via LDAP et sauvegarde le mot de passe à la première connexion
    """
    try:
        # Récupération de la configuration LDAP
        result = await db.execute(
            select(LdapConfig).where(LdapConfig.name == "CHEM_AUTHENTICATION")
        )
        ldap_config = result.scalars().first()

        if not ldap_config:
            logger.error("Configuration LDAP introuvable")
            return False

        # Configuration du serveur LDAP
        server = Server(
            host=ldap_config.host,
            port=ldap_config.port,
            get_info=ALL,
            use_ssl=False
        )

        # Construction du DN utilisateur
        user_dn = f"{user.ldap_login}@{ldap_config.bind_dn}"

        # Tentative d'authentification
        with Connection(
            server,
            user=user_dn,
            password=password,
            authentication=SIMPLE,
            auto_bind=True
        ) as conn:
            
            if conn.bound:
                # Sauvegarder le mot de passe hashé à la première connexion réussie
                if not user.hashed_password:
                    user.hashed_password = hash_password(password)
                    db.add(user)
                    await db.commit()
                    logger.info(f"Mot de passe sauvegardé pour {user.ldap_login}")
                
                return True
            
            return False

    except Exception as e:
        logger.error(f"Erreur authentification LDAP pour {user.ldap_login}: {e}")
        return False
    

async def verify_ldap_user_exists(ldap_login: str, db: AsyncSession) -> bool:
    """
    Vérifie qu'un utilisateur existe dans LDAP sans authentification
    """
    try:
        # Récupération config LDAP
        result = await db.execute(
            select(LdapConfig).where(LdapConfig.name == "CHEM_AUTHENTICATION")
        )
        ldap_config = result.scalars().first()

        if not ldap_config:
            logger.error("Configuration LDAP introuvable")
            return False

        # Connexion avec compte de service
        server = Server(
            host=ldap_config.host,
            port=ldap_config.port,
            get_info=ALL,
            use_ssl=False
        )

        with Connection(
            server,
            user=ldap_config.bind_dn,
            password=ldap_config.bind_password,
            authentication=SIMPLE,
            auto_bind=True
        ) as conn:
            
            # Recherche utilisateur (sécurisée contre injection LDAP)
            escaped_login = escape_filter_chars(ldap_login)
            search_filter = f"(sAMAccountName={escaped_login})"
            conn.search(
                search_base=ldap_config.base_dn,
                search_filter=search_filter,
                attributes=['cn', 'sAMAccountName']
            )
            
            return len(conn.entries) > 0

    except Exception as e:
        logger.error(f"Erreur vérification LDAP: {e}")
        return False