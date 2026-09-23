import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.models.pricing import PricingSuggestion
from app.database import engine, Base
from app.models.user import User
from app.models.product import Product
from app.routes.auth import router as auth_router
from app.routes.products import router as product_router
from app.routes.catalogue import router as catalogue_router
from app.models.catalogue_draft import CatalogueDraft
from app.routes.pricing import router as pricing_router
from app.models.buyer_requirement import BuyerRequirement
from app.routes.buyer_requirements import router as buyer_requirement_router
from app.routes.matching import router as matching_router
from app.models.quotation import Quotation
from app.routes.quotations import router as quotation_router
from app.models.order import Order
from app.routes.orders import router as order_router
from app.routes.upload import router as upload_router

app = FastAPI(
    title="KariGo Backend",
    description="AI-driven market linkage platform for artisans",
    version="1.0.0",
)

CORS_ORIGINS = [
    "https://karigosixnova.netlify.app",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)


def apply_compatible_schema_updates():
    """Apply the small additive migration required by the current Order model."""
    inspector = inspect(engine)
    if "orders" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("orders")}
    if "requirement_id" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE orders ADD COLUMN requirement_id INTEGER"))


apply_compatible_schema_updates()

# Authentication routes
app.include_router(auth_router)

# Product routes
app.include_router(product_router)

# AI Catalogue routes
app.include_router(catalogue_router)

# Pricing routes
app.include_router(pricing_router)

# Buyer Requirement routes
app.include_router(buyer_requirement_router)

# Matching routes
app.include_router(matching_router)

# Quotation routes
app.include_router(quotation_router)

# Order routes
app.include_router(order_router)

# Image Upload routes
app.include_router(upload_router)

@app.get("/")
def home():
    return {"message": "KariGo Backend is running!"}


@app.get("/db-test")
def database_test():

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {"success": True, "message": "KariGo database connected successfully!"}

    except Exception as e:

        return {"success": False, "error": str(e)}
