import sys
import os

# Add the root app directory to the system path so we can import 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.food import Food

def seed_database():
    db: Session = SessionLocal()
    
    # Check if we already have Foods
    if db.query(Food).count() > 0:
        print("Database already seeded. Skipping.")
        db.close()
        return

    print("Seeding database with pristine Indian ICMR nutritional baselines...")

    # Data is normalized strictly per 100g
    foods = [
        # Grains & Breads
        Food(name="White Rice", protein_g=2.7, carbs_g=28, fats_g=0.3, base_calories=130),
        Food(name="Brown Rice", protein_g=2.6, carbs_g=23, fats_g=0.9, base_calories=111),
        Food(name="Roti (Wheat)", protein_g=9.0, carbs_g=52, fats_g=3.0, base_calories=265),
        Food(name="Naan", protein_g=9.6, carbs_g=49, fats_g=5.0, base_calories=290),
        Food(name="Dosa", protein_g=4.0, carbs_g=35, fats_g=6.0, base_calories=210),
        Food(name="Idly", protein_g=3.0, carbs_g=20, fats_g=0.5, base_calories=95),
        Food(name="Upma", protein_g=4.5, carbs_g=22, fats_g=8.0, base_calories=180),
        
        # Dals & Legumes
        Food(name="Toor Dal", protein_g=7.0, carbs_g=20, fats_g=1.5, base_calories=115),
        Food(name="Moong Dal", protein_g=8.0, carbs_g=18, fats_g=1.0, base_calories=105),
        Food(name="Masoor Dal", protein_g=9.0, carbs_g=20, fats_g=0.5, base_calories=116),
        Food(name="Chana Masala", protein_g=8.5, carbs_g=22, fats_g=6.0, base_calories=164),
        Food(name="Rajma Curry", protein_g=7.5, carbs_g=19, fats_g=5.0, base_calories=145),
        
        # Curries & Vegetables
        Food(name="Palak Paneer", protein_g=11.0, carbs_g=5, fats_g=18.0, base_calories=240),
        Food(name="Paneer Butter Masala", protein_g=12.0, carbs_g=6, fats_g=25.0, base_calories=310),
        Food(name="Aloo Gobi", protein_g=2.5, carbs_g=11, fats_g=6.0, base_calories=110),
        Food(name="Bhindi Masala", protein_g=2.0, carbs_g=7, fats_g=7.0, base_calories=95),
        Food(name="Baingan Bharta", protein_g=1.5, carbs_g=6, fats_g=8.0, base_calories=105),
        
        # Non-Veg
        Food(name="Chicken Curry", protein_g=15.0, carbs_g=4, fats_g=12.0, base_calories=185),
        Food(name="Butter Chicken", protein_g=14.0, carbs_g=5, fats_g=18.0, base_calories=240),
        Food(name="Chicken Tikka", protein_g=24.0, carbs_g=2, fats_g=5.0, base_calories=150),
        Food(name="Mutton Curry", protein_g=13.0, carbs_g=3, fats_g=16.0, base_calories=220),
        Food(name="Fish Fry", protein_g=18.0, carbs_g=1, fats_g=14.0, base_calories=205),
        Food(name="Egg Curry", protein_g=11.0, carbs_g=4, fats_g=13.0, base_calories=175),
        
        # Snacks & Street Food
        Food(name="Samosa", protein_g=4.0, carbs_g=24, fats_g=18.0, base_calories=260),
        Food(name="Pakora", protein_g=5.0, carbs_g=22, fats_g=15.0, base_calories=240),
        Food(name="Vada Pav", protein_g=6.0, carbs_g=30, fats_g=14.0, base_calories=270),
        Food(name="Pani Puri", protein_g=3.0, carbs_g=25, fats_g=5.0, base_calories=150),
        Food(name="Bhel Puri", protein_g=4.0, carbs_g=35, fats_g=6.0, base_calories=190),
        
        # Raw Fats & Bases
        Food(name="Ghee", protein_g=0.0, carbs_g=0, fats_g=99.5, base_calories=900),
        Food(name="Coconut Oil", protein_g=0.0, carbs_g=0, fats_g=100.0, base_calories=862),
        Food(name="Mustard Oil", protein_g=0.0, carbs_g=0, fats_g=100.0, base_calories=884),
        Food(name="Curd (Whole Milk)", protein_g=3.5, carbs_g=4.5, fats_g=3.3, base_calories=61),
        
        # Desserts
        Food(name="Gulab Jamun", protein_g=3.0, carbs_g=45, fats_g=12.0, base_calories=300),
        Food(name="Rasgulla", protein_g=3.5, carbs_g=35, fats_g=1.5, base_calories=180),
        Food(name="Kheer", protein_g=4.0, carbs_g=22, fats_g=5.0, base_calories=145),
        Food(name="Jalebi", protein_g=1.0, carbs_g=60, fats_g=14.0, base_calories=370),
    ]

    for f in foods:
        db.add(f)
        
    db.commit()
    print(f"Successfully seeded {len(foods)} structural foods into the catalog!")
    db.close()

if __name__ == "__main__":
    seed_database()
