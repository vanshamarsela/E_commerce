from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from models import Product, Category, Review, User, Admin, RefreshToken, Order, OrderItem, Cart, CartItem, PaymentTransaction
from schemas import (
    ProductCreate, ProductUpdate, CategoryCreate, CategoryUpdate,
    ReviewCreate, ReviewUpdate, UserCreate, UserUpdate, AdminCreate
    , OrderCreate, OrderUpdate
)
from auth import get_password_hash

# Category CRUD
def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Category).offset(skip).limit(limit).all()

def get_category(db: Session, category_id: int):
    return db.query(Category).filter(Category.id == category_id).first()

def create_category(db: Session, category: CategoryCreate):
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, category: CategoryUpdate):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category:
        for key, value in category.model_dump().items():
            setattr(db_category, key, value)
        db.commit()
        db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category:
        db.delete(db_category)
        db.commit()
    return db_category

# Product CRUD
def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Product).options(
        joinedload(Product.category_rel),
        joinedload(Product.reviews)
    ).offset(skip).limit(limit).all()

def get_product(db: Session, product_id: int):
    return db.query(Product).options(
        joinedload(Product.category_rel),
        joinedload(Product.reviews)
    ).filter(Product.id == product_id).first()

def create_product(db: Session, product: ProductCreate):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product: ProductUpdate):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if db_product:
        for key, value in product.model_dump().items():
            setattr(db_product, key, value)
        db.commit()
        db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if db_product:
        db.delete(db_product)
        db.commit()
    return db_product

# Review CRUD
def get_reviews_by_product(db: Session, product_id: int):
    return db.query(Review).filter(Review.product_id == product_id).all()

def create_review(db: Session, product_id: int, review: ReviewCreate):
    db_review = Review(product_id=product_id, **review.model_dump())
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

def update_review(db: Session, review_id: int, review: ReviewUpdate):
    db_review = db.query(Review).filter(Review.id == review_id).first()
    if db_review:
        for key, value in review.model_dump().items():
            setattr(db_review, key, value)
        db.commit()
        db.refresh(db_review)
    return db_review

def delete_review(db: Session, review_id: int):
    db_review = db.query(Review).filter(Review.id == review_id).first()
    if db_review:
        db.delete(db_review)
        db.commit()
    return db_review

# User CRUD
def get_users(db: Session, skip: int = 0, limit: int = 100, exclude_admin: bool = False):
    q = db.query(User)
    if exclude_admin:
        q = q.filter(User.is_admin.is_(False))
    return q.offset(skip).limit(limit).all()

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user: UserUpdate):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        update_data = user.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user

# Admin CRUD
def create_admin(db: Session, admin: AdminCreate):
    hashed_password = get_password_hash(admin.password)
    db_admin = Admin(
        email=admin.email,
        username=admin.username,
        full_name=admin.full_name,
        role=admin.role,
        deprecated=getattr(admin, "deprecated", False),
        hashed_password=hashed_password
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

# Refresh Token CRUD
def get_refresh_token(db: Session, token: str):
    return db.query(RefreshToken).filter(
        RefreshToken.token == token,
        RefreshToken.is_revoked == False,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()

def update_refresh_token_usage(db: Session, token_id: int):
    db_token = db.query(RefreshToken).filter(RefreshToken.id == token_id).first()
    if db_token:
        db_token.last_used_at = datetime.utcnow()
        db.commit()

def revoke_user_refresh_tokens(db: Session, user_id: int):
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"is_revoked": True})
    db.commit()

def get_user_refresh_tokens(db: Session, user_id: int):
    return db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.is_revoked == False
    ).all()

# Cart CRUD
def get_or_create_cart(db: Session, user_id: int) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

def get_cart(db: Session, user_id: int) -> Cart:
    cart = get_or_create_cart(db, user_id)
    return db.query(Cart).options(
        joinedload(Cart.cart_items).joinedload(CartItem.product)
    ).filter(Cart.id == cart.id).first()

def add_to_cart(db: Session, user_id: int, product_id: int, quantity: int = 1) -> Cart:
    if quantity <= 0:
        raise ValueError("Quantity must be greater than 0")

    # Ensure product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError("Product not found")

    cart = get_or_create_cart(db, user_id)
    item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product_id
    ).first()

    if item:
        item.quantity += quantity
    else:
        item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
        db.add(item)

    db.commit()
    return get_cart(db, user_id)

def set_cart_item_quantity(db: Session, user_id: int, product_id: int, quantity: int) -> Cart:
    cart = get_or_create_cart(db, user_id)
    item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product_id
    ).first()

    if not item:
        raise ValueError("Cart item not found")

    if quantity <= 0:
        db.delete(item)
    else:
        item.quantity = quantity

    db.commit()
    return get_cart(db, user_id)

def remove_from_cart(db: Session, user_id: int, product_id: int) -> Cart:
    cart = get_or_create_cart(db, user_id)
    item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product_id
    ).first()
    if not item:
        raise ValueError("Cart item not found")

    db.delete(item)
    db.commit()
    return get_cart(db, user_id)

def clear_cart(db: Session, user_id: int):
    cart = get_or_create_cart(db, user_id)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()

# Payment CRUD
def create_payment_transaction(
    db: Session,
    user_id: int,
    order_id: int,
    provider: str,
    status: str,
    amount_paise: int,
    currency: str = "INR",
    razorpay_order_id: str | None = None,
):
    payment = PaymentTransaction(
        user_id=user_id,
        order_id=order_id,
        provider=provider,
        status=status,
        amount_paise=amount_paise,
        currency=currency,
        razorpay_order_id=razorpay_order_id,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

def get_payment_by_razorpay_order_id(db: Session, user_id: int, razorpay_order_id: str):
    return db.query(PaymentTransaction).filter(
        PaymentTransaction.user_id == user_id,
        PaymentTransaction.razorpay_order_id == razorpay_order_id,
        PaymentTransaction.provider == "razorpay",
    ).first()

def mark_payment_success(
    db: Session,
    user_id: int,
    order_id: int,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
):
    payment = get_payment_by_razorpay_order_id(db, user_id, razorpay_order_id)
    if not payment:
        # Create a record if it doesn't exist (defensive)
        payment = PaymentTransaction(
            user_id=user_id,
            order_id=order_id,
            provider="razorpay",
            status="success",
            currency="INR",
            amount_paise=0,
            razorpay_order_id=razorpay_order_id,
        )
        db.add(payment)

    payment.status = "success"
    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.error_code = None
    payment.error_description = None

    db.commit()
    db.refresh(payment)
    return payment

def mark_payment_failed(
    db: Session,
    user_id: int,
    order_id: int,
    razorpay_order_id: str | None,
    amount_paise: int,
    error_code: str | None = None,
    error_description: str | None = None,
):
    payment = None
    if razorpay_order_id:
        payment = get_payment_by_razorpay_order_id(db, user_id, razorpay_order_id)

    if not payment:
        payment = PaymentTransaction(
            user_id=user_id,
            order_id=order_id,
            provider="razorpay",
            status="failed",
            currency="INR",
            amount_paise=amount_paise,
            razorpay_order_id=razorpay_order_id,
        )
        db.add(payment)

    payment.status = "failed"
    payment.error_code = error_code
    payment.error_description = error_description

    db.commit()
    db.refresh(payment)
    return payment

def get_payments_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(PaymentTransaction).filter(
        PaymentTransaction.user_id == user_id
    ).order_by(PaymentTransaction.created_at.desc()).offset(skip).limit(limit).all()

# Order CRUD
def create_order(db: Session, user_id: int, order: OrderCreate):
    """
    Create an order from provided items.
    - total is calculated from items
    - price is stored at purchase time (from current product.price)
    """
    db_order = Order(
        user_id=user_id,
        status="pending",
        total_amount=0.0,
        shipping_address=order.shipping_address,
        payment_method=order.payment_method,
        payment_status="pending",
    )
    db.add(db_order)
    db.flush()  # assign db_order.id without commit

    total_amount = 0.0
    for item in order.order_items:
        if item.quantity <= 0:
            raise ValueError("Quantity must be greater than 0")

        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise ValueError(f"Product not found: {item.product_id}")

        price = float(product.price)
        subtotal = price * item.quantity
        total_amount += subtotal

        db_item = OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=price,
            subtotal=subtotal,
        )
        db.add(db_item)

    db_order.total_amount = total_amount

    db.commit()
    db.refresh(db_order)

    # Return with relationships loaded
    return db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.order_items).joinedload(OrderItem.product),
    ).filter(Order.id == db_order.id).first()

def get_orders_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.order_items).joinedload(OrderItem.product),
    ).filter(
        Order.user_id == user_id
    ).order_by(
        Order.created_at.desc()
    ).offset(skip).limit(limit).all()

def get_order(db: Session, order_id: int):
    return db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.order_items).joinedload(OrderItem.product),
    ).filter(Order.id == order_id).first()

def update_order_status(db: Session, order_id: int, order_update: OrderUpdate):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        return None

    update_data = order_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_order, field, value)

    db.commit()
    db.refresh(db_order)
    return db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.order_items).joinedload(OrderItem.product),
    ).filter(Order.id == db_order.id).first()

def get_all_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.order_items).joinedload(OrderItem.product),
    ).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()