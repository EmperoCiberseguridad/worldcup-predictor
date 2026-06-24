from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)

    group = Column(String)  # 👈 ESTE ES EL FIX

    date = Column(String)
    stage = Column(String)

    home_team = Column(String)
    away_team = Column(String)

    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)

    status = Column(String)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    match_id = Column(Integer, ForeignKey("matches.id"))

    prediction = Column(String)

    match = relationship("Match")