from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    artisan_id = Column(Integer, nullable=False)

    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    category = Column(String, nullable=True)
    material = Column(String, nullable=True)
    region = Column(String, nullable=True)

    price = Column(Float, nullable=True)
    quantity = Column(Integer, default=1)

    image_url = Column(String, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )