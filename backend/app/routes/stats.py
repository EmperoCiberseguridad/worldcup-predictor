from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Match, Prediction

router = APIRouter()


def get_result(match: Match):
    if match.home_score is None or match.away_score is None:
        return None

    if match.home_score > match.away_score:
        return "home"
    elif match.home_score < match.away_score:
        return "away"
    else:
        return "draw"


@router.get("/")
def get_stats(db: Session = Depends(get_db)):

    predictions = db.query(Prediction).all()

    played = 0
    correct = 0
    wrong = 0
    pending = 0

    for p in predictions:

        match = db.query(Match).filter(Match.id == p.match_id).first()

        # 🔥 FIX CRÍTICO
        if not match:
            continue

        result = get_result(match)

        # pendiente (partido sin jugar aún)
        if result is None:
            pending += 1
            continue

        played += 1

        if p.prediction == result:
            correct += 1
        else:
            wrong += 1

    accuracy = (correct / played * 100) if played > 0 else 0

    return {
        "played": played,
        "correct": correct,
        "wrong": wrong,
        "pending": pending,
        "accuracy": round(accuracy, 2)
    }