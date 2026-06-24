from pydantic import BaseModel


class MatchResponse(BaseModel):
    id: int
    date: str
    stage: str
    home_team: str
    away_team: str
    home_score: int | None = None
    away_score: int | None = None
    status: str

    class Config:
        from_attributes = True

class PredictionCreate(BaseModel):
    match_id: int
    prediction: str
