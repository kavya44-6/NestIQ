from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

from price_predictor import run_valuation, HAS_SKLEARN
from recommendation_engine import calculate_similarity_sklearn, calculate_similarity_pure, HAS_SKLEARN as REC_HAS_SKLEARN
from ocr_verifier import verify_document

app = FastAPI(title="NestIQ AI Services", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8089", "http://localhost:5173", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PriceRequest(BaseModel):
    city: str = "Chennai"
    district: str = ""
    bhk: int = 2
    area: float = 1000
    furnished: str = "Semi Furnished"
    parking: bool = True
    property_age: float = 5.0
    bathrooms: int = 2

class RecommendRequest(BaseModel):
    user: dict
    properties: List[dict]

class OcrRequest(BaseModel):
    file_path: str
    submitted_number: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "nestiq-ai", "sklearn": HAS_SKLEARN}

@app.post("/predict-price")
def predict_price(req: PriceRequest):
    try:
        res = run_valuation(req.city, req.bhk, req.area, req.furnished, req.parking, req.property_age, req.bathrooms)
        return {"status": "success", **res}
    except Exception as e:
        return {"status": "error", "message": str(e), "fallback": True}

@app.post("/recommend")
def recommend(req: RecommendRequest):
    try:
        if REC_HAS_SKLEARN:
            results = calculate_similarity_sklearn(req.user, req.properties)
            engine = "sklearn"
        else:
            results = calculate_similarity_pure(req.user, req.properties)
            engine = "pure_python"
        return {"status": "success", "engine": engine, "results": results[:5]}
    except Exception as e:
        return {"status": "error", "message": str(e), "fallback": True}

@app.post("/verify-rera")
def verify_rera(req: OcrRequest):
    try:
        result = verify_document(req.file_path, req.submitted_number)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e), "fallback": True}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
