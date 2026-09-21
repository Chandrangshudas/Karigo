from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class PricingSuggestion(Base):
    __tablename__ = "pricing_suggestions"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(Integer, nullable=False)
    artisan_id = Column(Integer, nullable=False)

    material_cost = Column(Float, nullable=False)
    labour_cost = Column(Float, nullable=False)
    other_cost = Column(Float, default=0)

    total_cost = Column(Float, nullable=False)

    suggested_min_price = Column(Float, nullable=False)
    suggested_max_price = Column(Float, nullable=False)

    status = Column(
        String,
        default="SUGGESTED"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )