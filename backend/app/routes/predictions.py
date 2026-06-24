from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import Prediction

router = APIRouter()


# Schema Pydantic para recibir el body JSON
class PredictionCreate(BaseModel):
    match_id: int
    prediction: str  # "home" | "draw" | "away"


@router.get("/")
def get_predictions(db: Session = Depends(get_db)):
    """Devuelve todas las predicciones guardadas.
    El frontend la usa para reconstruir los picks del usuario al recargar."""
    return db.query(Prediction).all()


@router.post("/")
def create_prediction(body: PredictionCreate, db: Session = Depends(get_db)):
    """Guarda o actualiza el pronostico de un partido (upsert).
    Si ya existe una prediccion para ese match_id, la actualiza en lugar
    de crear un duplicado. Asi /stats/ nunca cuenta dos veces el mismo partido."""

    existing = (
        db.query(Prediction)
        .filter(Prediction.match_id == body.match_id)
        .first()
    )

    if existing:
        existing.prediction = body.prediction
        db.commit()
        db.refresh(existing)
        return existing

    new_prediction = Prediction(
        match_id=body.match_id,
        prediction=body.prediction,
    )

    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    return new_prediction


@router.delete("/")
def delete_all_predictions(db: Session = Depends(get_db)):
    """Borra todas las predicciones para empezar de cero.
    No toca los partidos, solo la tabla de predicciones."""
    deleted = db.query(Prediction).delete()
    db.commit()
    return {"deleted": deleted}


@router.delete("/{match_id}")
def delete_prediction(match_id: int, db: Session = Depends(get_db)):
    """Borra la prediccion de un solo partido (para reintentar)."""
    deleted = (
        db.query(Prediction)
        .filter(Prediction.match_id == match_id)
        .delete()
    )
    db.commit()
    return {"deleted": deleted, "match_id": match_id}