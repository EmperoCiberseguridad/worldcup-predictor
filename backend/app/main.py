from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import Base
from .routes import matches, predictions, stats


Base.metadata.create_all(bind=engine)

app = FastAPI(title="World Cup Predictor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(matches.router, prefix="/matches", tags=["Matches"])
app.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
app.include_router(stats.router, prefix="/stats", tags=["Stats"])

@app.get("/")
def home():
    return {"message": "World Cup Predictor API"}