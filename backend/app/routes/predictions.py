from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import Prediction

router = APIRouter()


# Schema Pydantic para recibir el body JSON correctamente
class PredictionCreate(BaseModel):
    match_id: int
    prediction: str  # "home" | "draw" | "away"


@router.post("/")
def create_prediction(body: PredictionCreate, db: Session = Depends(get_db)):

    new_prediction = Prediction(
        match_id=body.match_id,
        prediction=body.prediction
    )

    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    return new_prediction