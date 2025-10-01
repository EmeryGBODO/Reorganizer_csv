from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.database.database import get_db 
from app.models.models import Campaign
from app.schemas.campaign_schema import CampaignCreate, CampaignResponse, CampaignUpdate
from app.services.campaign_service import CampaignService

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

@router.get("/", response_model=List[CampaignResponse])
async def get_campaigns(db: AsyncSession = Depends(get_db), skip: int = 0):
    campaigns = await CampaignService.get_campaigns(db, skip=skip)
    return campaigns

@router.post("/", response_model=CampaignResponse)
async def create_campaign(campaign: CampaignCreate, db: AsyncSession = Depends(get_db)):
    db_campaign = await CampaignService.create_campaign(db, campaign)
    return db_campaign

@router.put("/{campaign_uuid}", response_model=CampaignResponse)
async def update_campaign(campaign_uuid: str, campaign: CampaignUpdate, db: AsyncSession = Depends(get_db)):
    db_campaign = await CampaignService.update_campaign(db, campaign_uuid, campaign)
    return db_campaign

@router.delete("/{campaign_uuid}", response_model=dict)
async def delete_campaign(campaign_uuid: str, db: AsyncSession = Depends(get_db)):
    await CampaignService.delete_campaign(db, campaign_uuid)
    return {"message": "Campagne supprimée avec succès"}