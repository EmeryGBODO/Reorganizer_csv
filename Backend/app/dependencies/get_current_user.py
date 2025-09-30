from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.core.config import SECRET_KEY, ALGORITHM
from app.schemas.token_schema import TokenPayload
from app.services import auth_service
from app.database.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_uuid: str = payload.get("sub")
        if user_uuid is None:
            raise credentials_exception
        token_data = TokenPayload(sub=user_uuid)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.uuid == token_data.sub).first()
    if user is None:
        raise credentials_exception
    return user