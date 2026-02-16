from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, ARRAY, JSON, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship with products
    products = relationship("Product", back_populates="category_rel")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    price = Column(Float, nullable=False)
    discount_percentage = Column(Float, default=0.0)
    rating = Column(Float, default=0.0)
    stock_quantity = Column(Integer, default=0)
    tags = Column(ARRAY(String), default=list)
    brand = Column(String(100))
    sku = Column(String(50), unique=True)
    weight = Column(Float)
    dimensions = Column(JSON)  # {"width": float, "height": float, "depth": float}
    warranty_information = Column(String(255))
    shipping_information = Column(String(255))
    availability_status = Column(String(50), default="In Stock")
    return_policy = Column(String(255))
    minimum_order_quantity = Column(Integer, default=1)
    meta = Column(JSON)  # {"createdAt": str, "updatedAt": str, "barcode": str, "qrCode": str}
    images = Column(ARRAY(String), default=list)
    thumbnail = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category_rel = relationship("Category", back_populates="products")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    cart_items = relationship("CartItem", back_populates="product")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text)
    date = Column(DateTime(timezone=True), server_default=func.now())
    reviewer_name = Column(String(255), nullable=False)
    reviewer_email = Column(String(255), nullable=False)

    # Relationship with product
    product = relationship("Product", back_populates="reviews")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(50), default="pending")  # pending, processing, shipped, delivered, cancelled
    total_amount = Column(Float, nullable=False, default=0.0)
    shipping_address = Column(Text, nullable=False)
    payment_method = Column(String(50), nullable=False)  # razorpay, cash_on_delivery
    payment_status = Column(String(50), default="pending")  # pending, paid, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment_transactions = relationship("PaymentTransaction", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    price = Column(Float, nullable=False)  # price at time of purchase
    subtotal = Column(Float, nullable=False)  # quantity * price

    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")

class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="cart")
    cart_items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("cart_id", "product_id", name="uq_cart_product"),
    )

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    cart = relationship("Cart", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    cart = relationship("Cart", back_populates="user", uselist=False, cascade="all, delete-orphan")
    payment_transactions = relationship("PaymentTransaction", back_populates="user", cascade="all, delete-orphan")

class PaymentTransaction(Base):
    """
    Stores payment attempts/results for an order.
    For Razorpay:
    - razorpay_order_id is created first (status=created)
    - on success, razorpay_payment_id + signature are stored (status=success)
    - on failure/cancel, error fields are stored (status=failed)
    """
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)

    provider = Column(String(50), nullable=False, default="razorpay")  # razorpay
    status = Column(String(50), nullable=False, default="created")  # created, success, failed

    # Always store amount in smallest unit for accuracy (paise)
    amount_paise = Column(Integer, nullable=False, default=0)
    currency = Column(String(10), nullable=False, default="INR")

    razorpay_order_id = Column(String(100), index=True)
    razorpay_payment_id = Column(String(100), index=True)
    razorpay_signature = Column(String(255))

    error_code = Column(String(100))
    error_description = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="payment_transactions")
    order = relationship("Order", back_populates="payment_transactions")




class Admin(Base):
    """
    Admin table. Use deprecated=True to soft-disable an admin (they cannot log in).
    """
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    deprecated = Column(Boolean, default=False)  # If True, admin cannot log in
    role = Column(String(50), default="admin")  # admin, super_admin, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(500), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_fingerprint = Column(String(255), nullable=False)
    user_agent = Column(Text)
    ip_address = Column(String(45))  # IPv4 or IPv6
    os = Column(String(100))
    browser = Column(String(100))
    device = Column(String(100))
    is_mobile = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used_at = Column(DateTime(timezone=True), server_default=func.now())
    is_revoked = Column(Boolean, default=False)

    # Relationship with user
    user = relationship("User", back_populates="refresh_tokens")