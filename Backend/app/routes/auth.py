from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.schemas.token_schema import Token
from app.schemas.user_schema import UserPublic
from app.services import auth_service
from app.database.database import get_db 
from app.dependencies.get_current_user import get_current_user
from app.models.models import User

router = APIRouter()

@router.post("/login", response_model=Token)
def login_for_access_token(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = auth_service.authenticate_user(
        db, ldap_login=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host

    access_token, refresh_token = auth_service.create_user_tokens(
        db, user=user, user_agent=user_agent, ip_address=ip_address
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserPublic)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Route protégée pour récupérer les informations de l'utilisateur connecté.
    """
    return current_user