from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from auth import get_current_admin
from models import Admin
import crud, schemas

router = APIRouter()


# Categories (admin-only)
@router.get("/categories/", response_model=List[schemas.Category])
def admin_list_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return crud.get_categories(db, skip=skip, limit=limit)


@router.get("/categories/{category_id}", response_model=schemas.Category)
def admin_get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    db_category = crud.get_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category


@router.post("/categories/", response_model=schemas.Category)
def admin_create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return crud.create_category(db=db, category=category)


@router.put("/categories/{category_id}", response_model=schemas.Category)
def admin_update_category(
    category_id: int,
    category: schemas.CategoryUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    db_category = crud.update_category(db, category_id=category_id, category=category)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category


@router.delete("/categories/{category_id}")
def admin_delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    db_category = crud.delete_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}


# Products (admin-only)
@router.get("/products/", response_model=List[schemas.Product])
def admin_list_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return crud.get_products(db, skip=skip, limit=limit)


@router.get("/products/{product_id}", response_model=schemas.Product)
def admin_get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product


@router.post("/products/", response_model=schemas.Product)
def admin_create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return crud.create_product(db=db, product=product)


@router.put("/products/{product_id}", response_model=schemas.Product)
def admin_update_product(
    product_id: int,
    product: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    db_product = crud.update_product(db, product_id=product_id, product=product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product


@router.delete("/products/{product_id}")
def admin_delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    db_product = crud.delete_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


# Users (admin-only, list only; admin users are excluded from list)
@router.get("/users/", response_model=List[schemas.User])
def admin_list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return crud.get_users(db, skip=skip, limit=limit, exclude_admin=True)
