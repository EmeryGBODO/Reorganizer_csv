from pydantic import BaseModel, Field
import uuid

class UserBase(BaseModel):
    ldap_login: str = Field(..., example="jdupont")
    full_name: str = Field(..., example="Jean Dupont")

class UserCreate(UserBase):
    password: str

class UserPublic(UserBase):
    uuid: uuid.UUID

    class Config:
        orm_mode = True