from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.security import verify_password, create_access_token, create_refresh_token, get_password_hash
from app.schemas.user_schema import UserCreate
from app.models.models import User, RefreshToken # Assurez-vous que vos modèles sont ici
from datetime import datetime

def get_user_by_login(db: Session, ldap_login: str):
    return db.query(User).filter(User.ldap_login == ldap_login).first()

def authenticate_user(db: Session, ldap_login: str, password: str):
    user = get_user_by_login(db, ldap_login)
    if not user:
        return None
    # Pour un utilisateur local, on vérifie le mot de passe haché.
    # Si c'est un utilisateur LDAP, cette logique devra être adaptée.
    if not user.hashed_password or not verify_password(password, user.hashed_password):
        return None
    return user

def create_user_tokens(db: Session, user: User, user_agent: str, ip_address: str):
    # Créer le jeton d'accès
    access_token = create_access_token(data={"sub": str(user.uuid)})
    
    # Créer et stocker le jeton de rafraîchissement
    refresh_token_str, expires_at = create_refresh_token(data={"sub": str(user.uuid)})
    
    db_refresh_token = RefreshToken(
        user_id=user.uuid,
        token=refresh_token_str,
        user_agent=user_agent,
        ip_address=ip_address,
        expires_at=expires_at,
    )
    db.add(db_refresh_token)
    db.commit()
    db.refresh(db_refresh_token)
    
    return access_token, refresh_token_str