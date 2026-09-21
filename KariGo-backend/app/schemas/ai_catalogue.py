from pydantic import BaseModel
from typing import Optional, List


class CatalogueResponse(BaseModel):
    name: str
    description: str
    category: str
    material: Optional[str] = None
    region: Optional[str] = None
    tags: List[str] = []