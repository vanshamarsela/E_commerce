from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import products, categories, reviews, auth, orders, cart, payments, admin
from database import engine
from models import Base
from models import User, Admin
from auth import get_password_hash
from models import User
Base.metadata.create_all(bind=engine)



from database import SessionLocal
admin_data = {
    "username": "vansh",
    "email": "amarselav@gmail.com",
    "password": "123456",
    "full_name": "Vansh Amarsela",
}

db = SessionLocal()

try:
    admin_exists = db.query(Admin).first()

    if not admin_exists:
        print("NO ADMIN FOUND IN THE DATABASE")

        db_admin = Admin(
            email=admin_data["email"],
            username=admin_data["username"],
            full_name=admin_data["full_name"],
            hashed_password=get_password_hash(admin_data["password"]),
        )

        db.add(db_admin)
        db.commit()
        db.refresh(db_admin)

        print("ADMIN CREATED SUCCESSFULLY")

except Exception as e:
    db.rollback()
    print(f"Admin creation failed: {e}")

finally:
    db.close()
  
# Seed database if empty; always ensure default admin exists
try:
    from database import SessionLocal
    from models import Product
    db = SessionLocal()
    product_count = db.query(Product).count()
    db.close()
   
     
    if product_count == 0:
        from seed_data import seed_data
        seed_data()
        print("Database seeded successfully")
    else:
        print("Database already contains data, skipping seeding")

    from seed_data import ensure_default_admin
    ensure_default_admin()
except Exception as e:
    print(f"Seeding check failed: {e}")

app = FastAPI(title="Ecommerce API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000","http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(products.router, prefix="/api/v1", tags=["products"])
app.include_router(categories.router, prefix="/api/v1", tags=["categories"])
app.include_router(reviews.router, prefix="/api/v1", tags=["reviews"])
app.include_router(orders.router, prefix="/api/v1", tags=["orders"])
app.include_router(cart.router, prefix="/api/v1", tags=["cart"])
app.include_router(payments.router, prefix="/api/v1", tags=["payments"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Ecommerce API"}