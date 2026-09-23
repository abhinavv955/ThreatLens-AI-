from pydantic import BaseModel
from typing import Optional, Dict, Any

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    contextUsed: Optional[Dict[str, Any]] = None
