from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import DECIMAL, Column, DateTime, Integer, String, create_engine, desc
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/cashback_db",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    client_ip = Column(String(45), index=True, nullable=False)
    client_type = Column(String(20), nullable=False)
    original_amount = Column(DECIMAL(10, 2), nullable=False)
    discount_percent = Column(DECIMAL(5, 2), nullable=False)
    final_amount = Column(DECIMAL(10, 2), nullable=False)
    cashback = Column(DECIMAL(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ClientType(str, Enum):
    regular = "regular"
    vip = "vip"


class CashbackRequest(BaseModel):
    client_type: ClientType
    purchase_amount: float = Field(gt=0)
    discount_percent: float = Field(ge=0, le=100)


class CashbackResponse(BaseModel):
    client_type: str
    purchase_amount: float
    discount_percent: float
    final_amount: float
    cashback: float


def to_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_cashback(client_type: ClientType, purchase_amount: float, discount_percent: float):
    purchase = Decimal(str(purchase_amount))
    discount = Decimal(str(discount_percent)) / Decimal("100")
    final_amount = purchase * (Decimal("1") - discount)

    base_cashback = final_amount * Decimal("0.05")
    promotion_multiplier = Decimal("2") if final_amount > Decimal("500") else Decimal("1")
    cashback_after_promo = base_cashback * promotion_multiplier

    vip_bonus = cashback_after_promo * Decimal("0.10") if client_type == ClientType.vip else Decimal("0")
    total_cashback = cashback_after_promo + vip_bonus

    return {
        "final_amount": to_money(final_amount),
        "cashback": to_money(total_cashback),
    }


app = FastAPI(title="Cashback API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def home():
    return FileResponse("static/index.html")


@app.post("/api/calculate", response_model=CashbackResponse)
def calculate_endpoint(payload: CashbackRequest, request: Request):
    result = calculate_cashback(payload.client_type, payload.purchase_amount, payload.discount_percent)
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
    ip = ip.split(",")[0].strip()

    db = SessionLocal()
    try:
        row = Consultation(
            client_ip=ip,
            client_type=payload.client_type.value,
            original_amount=Decimal(str(payload.purchase_amount)),
            discount_percent=Decimal(str(payload.discount_percent)),
            final_amount=result["final_amount"],
            cashback=result["cashback"],
        )
        db.add(row)
        db.commit()
    except Exception as exc:  # pragma: no cover
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar consulta: {exc}") from exc
    finally:
        db.close()

    return CashbackResponse(
        client_type=payload.client_type.value,
        purchase_amount=payload.purchase_amount,
        discount_percent=payload.discount_percent,
        final_amount=float(result["final_amount"]),
        cashback=float(result["cashback"]),
    )


@app.get("/api/history")
def history(request: Request):
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
    ip = ip.split(",")[0].strip()

    db = SessionLocal()
    try:
        rows = (
            db.query(Consultation)
            .filter(Consultation.client_ip == ip)
            .order_by(desc(Consultation.created_at))
            .limit(50)
            .all()
        )
        return [
            {
                "client_type": row.client_type,
                "purchase_amount": float(row.original_amount),
                "discount_percent": float(row.discount_percent),
                "final_amount": float(row.final_amount),
                "cashback": float(row.cashback),
                "created_at": row.created_at.isoformat(),
            }
            for row in rows
        ]
    finally:
        db.close()
