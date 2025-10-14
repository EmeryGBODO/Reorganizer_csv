import pandas as pd
from fastapi import HTTPException, status
from io import StringIO

# Simule la structure de vos modèles/schémas pour la clarté
# Dans votre code, vous importeriez vos vrais schémas Pydantic ou modèles SQLAlchemy
class ColumnRule:
    def __init__(self, type: str, value: any = None):
        self.type = type
        self.value = value

class CampaignColumn:
    def __init__(self, name: str, rules: list[ColumnRule]):
        self.name = name
        self.rules = rules

def apply_rule(series: pd.Series, rule: ColumnRule) -> pd.Series:       
    """Applique une seule règle à une colonne (Series) de Pandas."""
    if rule.type == 'TO_UPPERCASE':
        return series.fillna("").astype(str).str.upper()
    if rule.type == 'TO_LOWERCASE':
        return series.fillna("").astype(str).str.lower()
    if rule.type == 'ADD_PREFIX':
        return str(rule.value) + series.astype(str)
    if rule.type == 'ADD_SUFFIX':
        return series.astype(str) + str(rule.value)
    if rule.type == 'REPLACE_TEXT':
        # S'attend à une valeur comme "ancien_texte,nouveau_texte"
        try:
            old, new = str(rule.value).split(',', 1)
            return series.str.replace(old, new, regex=False)
        except (ValueError, TypeError):
            # Ignore la règle si la valeur est mal formatée
            return series
    if rule.type == 'MULTIPLY_BY':
        try:
            # Tente de convertir la colonne en numérique, ignorant les erreurs
            numeric_series = pd.to_numeric(series, errors='coerce')
            return numeric_series * float(rule.value)
        except (ValueError, TypeError):
            # Si la multiplication échoue, retourne la colonne originale
            return series
    return series

def process_dataframe(df: pd.DataFrame, campaign_config: list[CampaignColumn]) -> pd.DataFrame:
    """
    Valide, transforme et réorganise un DataFrame Pandas selon la configuration d'une campagne.
    """
    # 1. Validation des colonnes
    expected_columns = {col.name for col in campaign_config}
    missing_columns = expected_columns - set(df.columns)
    if missing_columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Colonnes manquantes dans le fichier importé : {', '.join(missing_columns)}"
        )

    # 2. Application des règles de calcul
    for column_config in campaign_config:
        col_name = column_config.name
        if col_name in df.columns:
            # S'assure que la colonne est de type string pour les manipulations de texte
            if not pd.api.types.is_numeric_dtype(df[col_name]):
                 df[col_name] = df[col_name].astype(str).fillna('')
            print("application des règle de calcul", column_config.rules)
            for rule in column_config.rules:
                df[col_name] = apply_rule(df[col_name], rule)
                print(f"📌 Application règle {rule.type} sur colonne {col_name}")

    # 3. Réorganisation et sélection des colonnes
    print(f"📌 Réorganisation des colonnes : {campaign_config}")
    final_column_order = [col.name for col in campaign_config]
    print(f"📌 Réorganisation des colonnes : {final_column_order}")
    # S'assure que toutes les colonnes de l'ordre final existent avant de réorganiser
    print("📌 Colonnes attendues :", final_column_order)
    print("📌 Colonnes présentes dans df :", list(df.columns))

    final_columns_in_df = [col for col in final_column_order if col in df.columns]
    print("📌 Colonnes retenues :", final_columns_in_df)
    processed_df = df[final_columns_in_df]

    return processed_df