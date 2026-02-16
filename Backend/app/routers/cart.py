from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import crud, schemas
from auth import get_current_active_user
from models import User


router = APIRouter()


@router.get("/cart/", response_model=schemas.Cart)
def read_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return crud.get_cart(db=db, user_id=current_user.id)


@router.post("/cart/items/", response_model=schemas.Cart)
def add_item_to_cart(
    item: schemas.CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return crud.add_to_cart(
            db=db,
            user_id=current_user.id,
            product_id=item.product_id,
            quantity=item.quantity,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/cart/items/{product_id}", response_model=schemas.Cart)
def update_cart_item(
    product_id: int,
    item: schemas.CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return crud.set_cart_item_quantity(
            db=db,
            user_id=current_user.id,
            product_id=product_id,
            quantity=item.quantity,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/cart/items/{product_id}", response_model=schemas.Cart)
def remove_cart_item(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return crud.remove_from_cart(
            db=db,
            user_id=current_user.id,
            product_id=product_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/cart/")
def clear_user_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    crud.clear_cart(db=db, user_id=current_user.id)
    return {"message": "Cart cleared"}

