from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Prediction

router = APIRouter()

@router.post("/")
def create_prediction(match_id: int, prediction: str, db: Session = Depends(get_db)):

    new_prediction = Prediction(
        match_id=match_id,
        prediction=prediction
    )

    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    return new_prediction