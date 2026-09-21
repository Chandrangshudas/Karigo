from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database import Base


class CatalogueDraft(Base):
    __tablename__ = "catalogue_drafts"

    id = Column(Integer, primary_key=True, index=True)

    artisan_id = Column(Integer, nullable=False)

    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    category = Column(String, nullable=True)
    material = Column(String, nullable=True)
    region = Column(String, nullable=True)

    tags = Column(Text, nullable=True)

    image_url = Column(String, nullable=True)

    status = Column(
        String,
        default="DRAFT"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )