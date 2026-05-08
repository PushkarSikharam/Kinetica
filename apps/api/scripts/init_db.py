import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.main import Base, engine
Base.metadata.create_all(bind=engine)
print("All tables created successfully.")
