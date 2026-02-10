import socketio

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",   # ✅ פותר את ה-CORS של socket.io
)

@sio.event
async def connect(sid, environ):
    print("✅ socket connected:", sid)

@sio.event
async def disconnect(sid):
    print("❌ socket disconnected:", sid)
