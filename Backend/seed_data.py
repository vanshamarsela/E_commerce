from database import SessionLocal, Base, engine
from models import Product, Category, Review, OrderItem, Order, CartItem, Cart, PaymentTransaction, Admin
from schemas import ProductCreate, CategoryCreate, ReviewCreate, AdminCreate
import crud
from datetime import datetime

def seed_data():
    # Create tables first
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Check if data already exists
    existing_products = db.query(Product).count()
    if existing_products > 0:
        print("Data already exists in database - clearing and reseeding")
        # Clear existing data for development
        # IMPORTANT: delete children first to avoid FK violations
        db.query(PaymentTransaction).delete()
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(CartItem).delete()
        db.query(Cart).delete()
        db.query(Review).delete()
        db.query(Product).delete()
        db.query(Category).delete()
        db.commit()
        print("Cleared existing data")

    try:
        # Seed categories
        categories_data = [
            {"name": "Electronics", "description": "Electronic devices and gadgets"},
            {"name": "Gaming", "description": "Gaming accessories and equipment"},
            {"name": "Furniture", "description": "Home and office furniture"},
            {"name": "Accessories", "description": "Various accessories and peripherals"},
            {"name": "Beauty", "description": "Beauty and personal care products"},
            {"name": "Fashion", "description": "Clothing and apparel"},
            {"name": "Home Decor", "description": "Items to decorate your home"}
        ]

        categories = []
        for category_data in categories_data:
            category = CategoryCreate(**category_data)
            db_category = Category(**category.model_dump())
            db.add(db_category)
            categories.append(db_category)

        db.commit()

        # Get category IDs after commit
        electronics_cat = db.query(Category).filter(Category.name == "Electronics").first()
        gaming_cat = db.query(Category).filter(Category.name == "Gaming").first()
        furniture_cat = db.query(Category).filter(Category.name == "Furniture").first()
        accessories_cat = db.query(Category).filter(Category.name == "Accessories").first()
        beauty_cat = db.query(Category).filter(Category.name == "Beauty").first()
        fashion_cat = db.query(Category).filter(Category.name == "Fashion").first()
        decor_cat = db.query(Category).filter(Category.name == "Home Decor").first()

        # Sample product data with all fields
        products_data = [
            {
                "name": "Wireless Bluetooth Headphones",
                "description": "High-quality wireless headphones with noise cancellation and 30-hour battery life",
                "category_id": electronics_cat.id,
                "price": 199.99,
                "discount_percentage": 15.0,
                "stock_quantity": 50,
                "tags": ["electronics", "audio", "wireless", "trending"],
                "brand": "AudioTech",
                "sku": "AT-WBH-001",
                "weight": 0.3,
                "dimensions": {"width": 18.0, "height": 16.0, "depth": 8.0},
                "warranty_information": "2 years warranty",
                "shipping_information": "Ships in 1-2 business days",
                "availability_status": "In Stock",
                "return_policy": "30 days return policy",
                "minimum_order_quantity": 1,
                "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"],
                "thumbnail": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
                "meta": {
                    "createdAt": "2024-01-17T12:25:56.889Z",
                    "updatedAt": "2024-01-17T12:25:56.889Z",
                    "barcode": "1234567890123",
                    "qrCode": "https://cdn.dummyjson.com/public/qr-code.png"
                }
            },
            {
                "name": "Smart Watch Series X",
                "description": "Advanced smartwatch with health monitoring, GPS, and multiple sports modes",
                "category_id": electronics_cat.id,
                "price": 349.99,
                "discount_percentage": 10.0,
                "stock_quantity": 30,
                "tags": ["electronics", "wearable", "fitness", "trending"],
                "brand": "TechWear",
                "sku": "TW-SWX-002",
                "weight": 0.1,
                "dimensions": {"width": 4.2, "height": 4.2, "depth": 1.2},
                "warranty_information": "1 year warranty",
                "shipping_information": "Ships in 2-3 business days",
                "availability_status": "In Stock",
                "return_policy": "30 days return policy",
                "minimum_order_quantity": 1,
                "images": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"],
                "thumbnail": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
                "meta": {
                    "createdAt": "2024-01-17T12:25:56.889Z",
                    "updatedAt": "2024-01-17T12:25:56.889Z",
                    "barcode": "1234567890124",
                    "qrCode": "https://cdn.dummyjson.com/public/qr-code.png"
                }
            },
            {
                "name": "Mechanical Gaming Keyboard",
                "description": "RGB backlit mechanical keyboard with customizable keys and macro support",
                "category_id": gaming_cat.id,
                "price": 129.99,
                "discount_percentage": 5.0,
                "stock_quantity": 25,
                "tags": ["gaming", "keyboard", "rgb", "trending"],
                "brand": "GameKeys",
                "sku": "GK-MKB-003",
                "weight": 1.2,
                "dimensions": {"width": 44.0, "height": 13.5, "depth": 3.5},
                "warranty_information": "2 years warranty",
                "shipping_information": "Ships in 3-5 business days",
                "availability_status": "In Stock",
                "return_policy": "30 days return policy",
                "minimum_order_quantity": 1,
                "images": ["https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800"],
                "thumbnail": "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800",
                "meta": {
                    "createdAt": "2024-01-17T12:25:56.889Z",
                    "updatedAt": "2024-01-17T12:25:56.889Z",
                    "barcode": "1234567890125",
                    "qrCode": "https://cdn.dummyjson.com/public/qr-code.png"
                }
            },
            {
                "name": "Premium Leather Jacket",
                "description": "Handcrafted premium leather jacket with vintage finish and silk lining",
                "category_id": fashion_cat.id,
                "price": 249.99,
                "discount_percentage": 20.0,
                "stock_quantity": 12,
                "tags": ["fashion", "clothing", "leather", "trending"],
                "brand": "LuxeStyle",
                "sku": "LS-PLJ-006",
                "weight": 1.5,
                "dimensions": {"width": 50.0, "height": 70.0, "depth": 5.0},
                "warranty_information": "1 year limited warranty",
                "shipping_information": "Ships in 3-5 business days",
                "availability_status": "In Stock",
                "return_policy": "15 days return policy",
                "minimum_order_quantity": 1,
                "images": ["https://images.unsplash.com/photo-1551028150-64b9f398f678?w=800"],
                "thumbnail": "https://images.unsplash.com/photo-1551028150-64b9f398f678?w=800",
                "meta": {
                    "createdAt": "2024-01-17T12:25:56.889Z",
                    "updatedAt": "2024-01-17T12:25:56.889Z",
                    "barcode": "1234567890128",
                    "qrCode": "https://cdn.dummyjson.com/public/qr-code.png"
                }
            },
            {
                "name": "Minimalist Ceramic Vase",
                "description": "Elegant minimalist ceramic vase for modern home decor",
                "category_id": decor_cat.id,
                "price": 45.00,
                "discount_percentage": 0.0,
                "stock_quantity": 40,
                "tags": ["decor", "home", "ceramic", "trending"],
                "brand": "Artisanal",
                "sku": "AR-MCV-007",
                "weight": 0.8,
                "dimensions": {"width": 15.0, "height": 30.0, "depth": 15.0},
                "warranty_information": "N/A",
                "shipping_information": "Ships in 2-4 business days",
                "availability_status": "In Stock",
                "return_policy": "30 days return policy",
                "minimum_order_quantity": 1,
                "images": ["https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800"],
                "thumbnail": "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800",
                "meta": {
                    "createdAt": "2024-01-17T12:25:56.889Z",
                    "updatedAt": "2024-01-17T12:25:56.889Z",
                    "barcode": "1234567890129",
                    "qrCode": "https://cdn.dummyjson.com/public/qr-code.png"
                }
            },
            {
                "name": "Noise Cancelling Earbuds",
                "description": "Compact noise cancelling earbuds with crystal clear sound and long battery",
                "category_id": electronics_cat.id,
                "price": 159.99,
                "discount_percentage": 10.0,
                "stock_quantity": 60,
                "tags": ["electronics", "audio", "trending"],
                "brand": "AudioTech",
                "sku": "AT-NCE-008",
                "weight": 0.05,
                "dimensions": {"width": 5.0, "height": 5.0, "depth": 2.5},
                "warranty_information": "2 years warranty",
                "shipping_information": "Ships in 1-2 business days",
                "availability_status": "In Stock",
                "return_policy": "30 days return policy",
                "minimum_order_quantity": 1,
                "images": ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800"],
                "thumbnail": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800",
                "meta": {
                    "createdAt": "2024-01-17T12:25:56.889Z",
                    "updatedAt": "2024-01-17T12:25:56.889Z",
                    "barcode": "1234567890130",
                    "qrCode": "https://cdn.dummyjson.com/public/qr-code.png"
                }
            }
        ]

        products = []
        for product_data in products_data:
            product = ProductCreate(**product_data)
            db_product = Product(**product.model_dump())
            db.add(db_product)
            products.append(db_product)

        # Flush so products get primary keys without ending the transaction.
        db.flush()

        # Debug: Check if products have IDs
        print(f"Created {len(products)} products")
        if products:
            print(f"First product ID: {products[0].id}, Name: {products[0].name}")

        # Add reviews for some products (use freshly-created product IDs; don't hard-code)
        product_by_name = {p.name: p for p in products}
        reviews_data = [
            {
                "product_id": product_by_name["Wireless Bluetooth Headphones"].id,
                "rating": 5,
                "comment": "Excellent sound quality and battery life!",
                "reviewer_name": "John Doe",
                "reviewer_email": "john.doe@example.com"
            },
            {
                "product_id": product_by_name["Wireless Bluetooth Headphones"].id,
                "rating": 4,
                "comment": "Great headphones, very comfortable",
                "reviewer_name": "Jane Smith",
                "reviewer_email": "jane.smith@example.com"
            },
            {
                "product_id": product_by_name["Smart Watch Series X"].id,
                "rating": 5,
                "comment": "Amazing features and design",
                "reviewer_name": "Mike Johnson",
                "reviewer_email": "mike.johnson@example.com"
            },
            {
                "product_id": product_by_name["Eyeshadow Palette with Mirror"].id,
                "rating": 5,
                "comment": "Great product!",
                "reviewer_name": "Savannah Gomez",
                "reviewer_email": "savannah.gomez@x.dummyjson.com"
            },
            {
                "product_id": product_by_name["Eyeshadow Palette with Mirror"].id,
                "rating": 4,
                "comment": "Awesome product!",
                "reviewer_name": "Christian Perez",
                "reviewer_email": "christian.perez@x.dummyjson.com"
            },
            {
                "product_id": product_by_name["Eyeshadow Palette with Mirror"].id,
                "rating": 1,
                "comment": "Poor quality!",
                "reviewer_name": "Nicholas Bailey",
                "reviewer_email": "nicholas.bailey@x.dummyjson.com"
            }
        ]

        for review_data in reviews_data:
            db_review = Review(**review_data)
            db.add(db_review)

        db.commit()

        # Calculate and update product ratings
        for product in products:
            reviews = db.query(Review).filter(Review.product_id == product.id).all()
            if reviews:
                avg_rating = sum(review.rating for review in reviews) / len(reviews)
                product.rating = round(avg_rating, 2)
        db.commit()

        print(f"Successfully seeded {len(categories)} categories, {len(products)} products, and {len(reviews_data)} reviews")

        # Seed default admin if none exists
        existing_admin = db.query(Admin).first()
        if not existing_admin:
            default_admin = AdminCreate(
                email="admin@example.com",
                username="admin",
                full_name="Admin User",
                role="admin",
                password="Admin123!",
                deprecated=False
            )
            crud.create_admin(db, default_admin)
            print("Created default admin: admin@example.com / Admin123!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()

    finally:
        db.close()

def ensure_default_admin():
    """Ensure at least one non-deprecated admin exists. Safe to call on every startup."""
    db = SessionLocal()
    try:
        existing = db.query(Admin).filter(Admin.deprecated.is_(False)).first()
        if not existing:
            default_admin = AdminCreate(
                email="admin@example.com",
                username="admin",
                full_name="Admin User",
                role="admin",
                password="Admin123!",
                deprecated=False
            )
            crud.create_admin(db, default_admin)
            print("Created default admin: admin@example.com / Admin123!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
    ensure_default_admin()