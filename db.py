import os
import psycopg2
from dotenv import load_dotenv
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.cart_item import CartItem

load_dotenv()

def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )
