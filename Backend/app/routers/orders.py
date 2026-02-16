from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import crud, schemas
from auth import get_current_active_user, get_current_admin
from models import User, Admin


router = APIRouter()

ALLOWED_PAYMENT_METHODS = {"cash_on_delivery", "razorpay"}

@router.post("/orders/", response_model=schemas.Order)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not order.order_items or len(order.order_items) == 0:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")
    if order.payment_method not in ALLOWED_PAYMENT_METHODS:
        raise HTTPException(status_code=400, detail="Unsupported payment method")

    try:
        return crud.create_order(db=db, user_id=current_user.id, order=order)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders/", response_model=List[schemas.Order])
def read_my_orders(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return crud.get_orders_by_user(db=db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/orders/{order_id}", response_model=schemas.Order)
def read_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db_order = crud.get_order(db=db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if db_order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this order")
    return db_order


# Admin endpoints
@router.get("/admin/orders/", response_model=List[schemas.Order])
def admin_read_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    return crud.get_all_orders(db=db, skip=skip, limit=limit)


@router.put("/admin/orders/{order_id}", response_model=schemas.Order)
def admin_update_order(
    order_id: int,
    order_update: schemas.OrderUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    db_order = crud.update_order_status(db=db, order_id=order_id, order_update=order_update)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

