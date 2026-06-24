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
            continue

        match = Match(
            id=m["id"],
            group=m["group"],
            home_team=m["home_team"],
            away_team=m["away_team"],
            date=m["date"],
            status=m["status"],
            home_score=m["home_score"],
            away_score=m["away_score"]
        )

        db.add(match)

    db.commit()
    db.close()


if __name__ == "__main__":
    seed_matches()