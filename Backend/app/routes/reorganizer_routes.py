from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import io

from app.database.database import get_db
from app.services import reorganizer_sevice
# from app.dependencies.get_current_user import get_current_user # Optionnel : pour protéger la route
# from app.models.user_model import User # Optionnel

router = APIRouter()

@router.post("/process/{campaign_uuid}")
async def process_file_endpoint(
    campaign_uuid: str,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...)
):
    """
    Endpoint pour uploader un fichier CSV et le traiter selon une campagne.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type de fichier invalide. Seuls les fichiers .csv sont acceptés par le backend."
        )
    print("Fichier reçu avec succès")
    try:
        processed_csv_str = await reorganizer_sevice.process_csv_file(
            db, 
            campaign_uuid, 
            file
        )

        # Renvoyer le CSV traité en tant que fichier à télécharger
        return StreamingResponse(
            iter([processed_csv_str]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=processed_{file.filename}"}
        )

    except HTTPException as e:
        # Fait remonter les erreurs HTTP gérées
        raise e
    except Exception as e:
        # Gère les erreurs inattendues
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Une erreur interne est survenue : {e}"
        )