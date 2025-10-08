from app.schemas.campaign_schema import CampaignCreate, CampaignUpdate, CampaignResponse
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import Campaign

class CampaignService:
    """Service de gestion des campagnes."""
    
    @staticmethod
    async def create_campaign(db: AsyncSession, campaign: CampaignCreate):
        """ Création de campagne """
        result = await db.execute(select(Campaign).where(Campaign.name == campaign.name))
        verify = result.scalar_one_or_none()
        if verify:
            raise ValueError("Cette campagne existe déjà")
        campaign_dict = campaign.model_dump()
        db_campaign = Campaign(**campaign_dict)
        db.add(db_campaign)
        await db.commit()
        await db.refresh(db_campaign)
        return db_campaign

    @staticmethod
    async def get_campaigns(db: AsyncSession, skip: int = 0):
        """ Récupération de toutes les campagnes """
        result = await db.execute(select(Campaign).offset(skip))
        return result.scalars().all()

    @staticmethod
    async def update_campaign(db: AsyncSession, campaign_uuid: str, campaign: CampaignUpdate):
        """ Mise à jour de campagne """
        result = await db.execute(select(Campaign).where(Campaign.uuid == campaign_uuid))
        db_campaign = result.scalar_one_or_none()
        if not db_campaign:
            raise ValueError("Campagne non trouvée")

        for key, value in campaign.model_dump().items():
            setattr(db_campaign, key, value)

        await db.commit()
        await db.refresh(db_campaign)
        return db_campaign

    @staticmethod
    async def delete_campaign(db: AsyncSession, campaign_uuid: str):
        """ Suppression de campagne """
        result = await db.execute(select(Campaign).where(Campaign.uuid == campaign_uuid))
        db_campaign = result.scalar_one_or_none()
        print(f"resultat de la recherche de la campagne à supprimer {db_campaign}")
        if not db_campaign:
            raise ValueError("Campagne non trouvée")

        await db.delete(db_campaign)
        await db.commit()
        return {"message": "Campagne supprimée avec succès"}

