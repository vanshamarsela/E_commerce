from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import crud, schemas

router = APIRouter()

@router.get("/products/{product_id}/reviews/", response_model=List[schemas.Review])
def read_reviews_by_product(product_id: int, db: Session = Depends(get_db)):
    # Check if product exists
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    reviews = crud.get_reviews_by_product(db, product_id=product_id)
    return reviews

@router.post("/products/{product_id}/reviews/", response_model=schemas.Review)
def create_review(product_id: int, review: schemas.ReviewCreate, db: Session = Depends(get_db)):
    # Check if product exists
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    return crud.create_review(db=db, product_id=product_id, review=review)

@router.put("/reviews/{review_id}", response_model=schemas.Review)
def update_review(review_id: int, review: schemas.ReviewUpdate, db: Session = Depends(get_db)):
    db_review = crud.update_review(db, review_id=review_id, review=review)
    if db_review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    return db_review

@router.delete("/reviews/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db)):
    db_review = crud.delete_review(db, review_id=review_id)
    if db_review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review deleted successfully"}