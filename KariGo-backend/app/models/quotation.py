from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)

    buyer_id = Column(Integer, nullable=False)
    artisan_id = Column(Integer, nullable=False)

    product_id = Column(Integer, nullable=False)
    requirement_id = Column(Integer, nullable=False)

    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    status = Column(
        String,
        default="PENDING"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )