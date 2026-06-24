from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from .models import Base, Match
import json

Base.metadata.create_all(bind=engine)


def seed_matches():
    db: Session = SessionLocal()

    with open("app/data/matches.json", "r", encoding="utf-8") as f:
        matches = json.load(f)

    for m in matches:
        existing = db.query(Match).filter(Match.id == m["id"]).first()

        if existing:
            # Actualiza los campos del partido ya existente.
            # Asi, cuando actualizas un resultado en matches.json
            # (de scheduled a finished con marcador), el cambio SI se aplica.
            existing.group = m["group"]
            existing.home_team = m["home_team"]
            existing.away_team = m["away_team"]
            existing.date = m["date"]
            existing.status = m["status"]
            existing.home_score = m["home_score"]
            existing.away_score = m["away_score"]
        else:
            match = Match(
                id=m["id"],
                group=m["group"],
                home_team=m["home_team"],
                away_team=m["away_team"],
                date=m["date"],
                status=m["status"],
                home_score=m["home_score"],
                away_score=m["away_score"],
            )
            db.add(match)

    db.commit()
    db.close()


if __name__ == "__main__":
    seed_matches()