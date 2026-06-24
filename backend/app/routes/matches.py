from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Match

router = APIRouter()

@router.get("/")
def get_matches(db: Session = Depends(get_db)):
    matches = db.query(Match).all()
    return matches