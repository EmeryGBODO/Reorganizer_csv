from typing import Literal, Dict, List
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


class Rule(BaseModel):
  id: str
  type: Literal["TO_UPPERCASE", "TO_LOWERCASE", "ADD_PREFIX", "ADD_SUFFIX", "MULTIPLY_BY", "REPLACE_TEXT"]
  value: str | int
  

class FielsBase(BaseModel):
  id: str
  name: str
  displayName: str
  order: int
  required: bool
  rules: List[Rule]

class CampaignBase(BaseModel):
    name: str
    description: str
    outputFilenameTemplate:str
    fields: List[FielsBase]
    
class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(CampaignBase):
    pass

class CampaignResponse(CampaignBase):
    uuid: UUID
    created_at: datetime
    updated_at: datetime

