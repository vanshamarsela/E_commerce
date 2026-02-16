from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Review Schemas
class ReviewBase(BaseModel):
    rating: int
    comment: Optional[str] = None
    reviewer_name: str
    reviewer_email: str

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(ReviewBase):
    pass

class Review(ReviewBase):
    id: int
    product_id: int
    date: Optional[datetime] = None

    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: float
    discount_percentage: float = 0.0
    stock_quantity: int = 0
    tags: List[str] = []
    brand: Optional[str] = None
    sku: Optional[str] = None
    weight: Optional[float] = None
    dimensions: Optional[dict] = None  # {"width": float, "height": float, "depth": float}
    warranty_information: Optional[str] = None
    shipping_information: Optional[str] = None
    availability_status: str = "In Stock"
    return_policy: Optional[str] = None
    minimum_order_quantity: int = 1
    images: List[str] = []
    thumbnail: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    rating: float = 0.0
    category_rel: Optional[Category] = None
    reviews: List[Review] = []
    meta: Optional[dict] = None  # {"createdAt": str, "updatedAt": str, "barcode": str, "qrCode": str}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Authentication Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    is_admin: Optional[bool] = False
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class AdminBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: str = "admin"
    deprecated: bool = False

class AdminCreate(AdminBase):
    password: str

class AdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    deprecated: Optional[bool] = None

class Admin(AdminBase):
    id: int
    is_active: bool
    deprecated: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None

class LoginRequest(BaseModel):
    username: str  # Can be email or username
    password: str

class RefreshTokenInfo(BaseModel):
    id: int
    device_fingerprint: str
    user_agent: Optional[str]
    ip_address: Optional[str]
    os: Optional[str]
    browser: Optional[str]
    device: Optional[str]
    is_mobile: bool
    issued_at: datetime
    last_used_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True

# Orders Schemas
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    price: float
    subtotal: float
    product: Optional[Product] = None

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    shipping_address: str
    payment_method: str

class OrderCreate(OrderBase):
    order_items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None

class Order(OrderBase):
    id: int
    user_id: int
    status: str
    total_amount: float
    payment_status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user: Optional[User] = None
    order_items: List[OrderItem] = []

    class Config:
        from_attributes = True

# Cart Schemas
class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: int

class CartItem(CartItemBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    product: Optional[Product] = None

    class Config:
        from_attributes = True

class Cart(BaseModel):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    cart_items: List[CartItem] = []

    class Config:
        from_attributes = True

# Payments Schemas
class PaymentTransactionBase(BaseModel):
    provider: str
    status: str
    currency: str = "INR"
    amount_paise: int = 0
    order_id: int

class PaymentTransaction(PaymentTransactionBase):
    id: int
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    error_code: Optional[str] = None
    error_description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True