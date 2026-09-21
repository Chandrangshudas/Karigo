from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base


class BuyerRequirement(Base):
    __tablename__ = "buyer_requirements"

    id = Column(Integer, primary_key=True, index=True)

    buyer_id = Column(Integer, nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    category = Column(String, nullable=True)
    material = Column(String, nullable=True)
    region = Column(String, nullable=True)

    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)

    quantity_required = Column(Integer, nullable=True)

    status = Column(String, default="OPEN")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )