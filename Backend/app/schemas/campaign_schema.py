from typing import Literal, Dict, List
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

class CampaignBase(BaseModel):
    name: str
    description: str
    fields: List[str]
    
class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(CampaignBase):
    pass

class CampaignResponse(CampaignBase):
    created_at: datetime
    updated_at: datetime

