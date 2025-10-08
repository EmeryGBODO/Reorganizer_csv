import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.future import select
from io import StringIO
import uuid

from app.models.models import Campaign 
from app.core.file_processor import process_dataframe, CampaignColumn, ColumnRule

async def process_csv_file(db: AsyncSession, campaign_uuid: str, file: UploadFile) -> str:
    """
    Orchestre le traitement d'un fichier CSV pour une campagne donnée.
    """
    # 1. Récupérer la campagne depuis la base de données
    result = await db.execute(select(Campaign).where(Campaign.uuid == campaign_uuid))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée."
        )

    # 2. Lire le contenu du fichier CSV avec Pandas
    try:
        # Lire le contenu du fichier uploadé en mémoire
        content = file.file.read().decode("utf-8")
        # Créer un DataFrame Pandas à partir du contenu
        df = pd.read_csv(StringIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de lire le fichier CSV : {e}"
        )
    print("Extraction effectué avec succès")
    # 3. Préparer la configuration pour le processeur
    # Votre modèle stocke probablement le JSON, il faut le parser.
    # Ici, nous simulons la structure attendue par process_dataframe.
    # Assurez-vous d'adapter ceci à la structure réelle de votre BDD.
    
    # Exemple de structure de "columns" dans votre modèle BDD:
    # [
    #   {"name": "col1", "displayName": "Colonne 1", "order": 0, "rules": [{"type": "TO_UPPERCASE"}]},
    #   {"name": "col2", "displayName": "Colonne 2", "order": 1, "rules": [{"type": "MULTIPLY_BY", "value": 1.2}]}
    # ]
    try:
        # Trier les colonnes par leur ordre
        sorted_columns_config = sorted(campaign.fields, key=lambda col: col.get('order', 0))
        print("Trie effectué avec succès", sorted_columns_config)
        campaign_config = [
            CampaignColumn(
                name=col.get('name'),
                rules=[ColumnRule(type=rule.get('type'), value=rule.get('value')) for rule in col.get('rules', [])]
            )
            for col in sorted_columns_config
        ]
    except (TypeError, AttributeError):
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="La configuration des colonnes pour cette campagne est invalide."
        )
    print("Trie terminer avec succès🎈🎈🎈")
    # 4. Appeler le processeur de données
    processed_df = process_dataframe(df, campaign_config)
    print("Traitement effectué avec succès")
    # 5. Convertir le DataFrame final en une chaîne CSV
    output = StringIO()
    processed_df.to_csv(output, index=False)
    
    return output.getvalue()