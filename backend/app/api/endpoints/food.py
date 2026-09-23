from fastapi import APIRouter, UploadFile, File, HTTPException
from ...schemas.meal import FoodScanResponse
from ...ai.food_recognition import food_recognition_service

router = APIRouter()

@router.post("/recognize", response_model=FoodScanResponse)
async def recognize_food(file: UploadFile = File(...)):
    # Validate content type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")
    
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="Image size exceeds 10MB limit")
        
    result = food_recognition_service.analyze_food_image(contents, file.filename)
    return FoodScanResponse(**result)
