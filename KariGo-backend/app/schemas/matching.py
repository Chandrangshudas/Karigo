from pydantic import BaseModel
from typing import List


class MatchResponse(BaseModel):
    product_id: int
    product_name: str
    match_score: int
    matched_fields: List[str]