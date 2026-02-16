import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from auth import get_current_active_user
from models import User
import crud, schemas

try:
    import razorpay
except Exception:  # pragma: no cover
    razorpay = None


router = APIRouter()


class RazorpayCreateOrderRequest(BaseModel):
    order_id: int  # internal order id


class RazorpayVerifyRequest(BaseModel):
    order_id: int  # internal order id
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class RazorpayFailRequest(BaseModel):
    order_id: int
    razorpay_order_id: str | None = None
    error_code: str | None = None
    error_description: str | None = None


def _get_razorpay_client():
    key_id = os.getenv("RAZORPAY_KEY_ID","rzp_test_RsjqxGORqpGz0K")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET","7EeL2lpUnGhNFiWWeMaj0Odz")

    if not key_id or not key_secret:
        raise HTTPException(status_code=500, detail="Razorpay keys not configured")

    if razorpay is None:
        raise HTTPException(status_code=500, detail="Razorpay SDK not installed")

    client = razorpay.Client(auth=(key_id, key_secret))
    return client, key_id


@router.post("/payments/razorpay/order")
def create_razorpay_order(
    payload: RazorpayCreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db_order = crud.get_order(db=db, order_id=payload.order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    if db_order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this order")

    if db_order.payment_method != "razorpay":
        raise HTTPException(status_code=400, detail="Order payment method is not razorpay")

    if db_order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Order is already paid")

    client, key_id = _get_razorpay_client()

    # Razorpay expects amount in the smallest currency unit (paise)
    amount_paise = int(round(float(db_order.total_amount) * 100))
    if amount_paise <= 0:
        raise HTTPException(status_code=400, detail="Invalid order amount")

    razorpay_order = client.order.create(
        {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"order_{db_order.id}",
        }
    )

    payment = crud.create_payment_transaction(
        db=db,
        user_id=current_user.id,
        order_id=db_order.id,
        provider="razorpay",
        status="created",
        amount_paise=amount_paise,
        currency="INR",
        razorpay_order_id=razorpay_order.get("id"),
    )

    return {
        "key_id": key_id,
        "razorpay_order_id": razorpay_order.get("id"),
        "amount": amount_paise,
        "currency": razorpay_order.get("currency", "INR"),
        "internal_order_id": db_order.id,
        "payment_transaction_id": payment.id,
    }


@router.post("/payments/razorpay/verify")
def verify_razorpay_payment(
    payload: RazorpayVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db_order = crud.get_order(db=db, order_id=payload.order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    if db_order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this order")

    client, _ = _get_razorpay_client()

    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": payload.razorpay_order_id,
                "razorpay_payment_id": payload.razorpay_payment_id,
                "razorpay_signature": payload.razorpay_signature,
            }
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Payment verification failed")

    crud.mark_payment_success(
        db=db,
        user_id=current_user.id,
        order_id=db_order.id,
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature,
    )

    # Mark internal order as paid
    updated = crud.update_order_status(
        db=db,
        order_id=db_order.id,
        order_update=schemas.OrderUpdate(status="processing", payment_status="paid"),
    )

    return {
        "message": "Payment verified",
        "order": updated,
    }


@router.post("/payments/razorpay/fail", response_model=schemas.PaymentTransaction)
def mark_razorpay_failed(
    payload: RazorpayFailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db_order = crud.get_order(db=db, order_id=payload.order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    if db_order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this order")

    amount_paise = int(round(float(db_order.total_amount) * 100))

    payment = crud.mark_payment_failed(
        db=db,
        user_id=current_user.id,
        order_id=db_order.id,
        razorpay_order_id=payload.razorpay_order_id,
        amount_paise=amount_paise,
        error_code=payload.error_code,
        error_description=payload.error_description,
    )

    # Optionally mark order as failed if you want (keeping it pending lets user retry)
    return payment


@router.get("/payments/", response_model=List[schemas.PaymentTransaction])
def list_my_payments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return crud.get_payments_by_user(db=db, user_id=current_user.id, skip=skip, limit=limit)

