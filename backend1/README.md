Inventory management system for ski equipment rentals with:
- JWT auth + roles (admin / employee)
- Products CRUD
- Inventory actions (take / return-taken)
- Rentals (rent / return-rented) with real `rentals` table
- Audit logs for key actions

## Tech Stack
- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT (python-jose)
- Password hashing (argon2)
- Real-time: (optional / not implemented yet)

## Setup
1) Create & activate venv
```powershell
python -m venv venv
.\venv\Scripts\activate
