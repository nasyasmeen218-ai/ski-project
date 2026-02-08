import socketio

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173"]
)

# אירוע בדיקה
@sio.event
async def connect(sid, environ, auth):
    print("✅ socket connected:", sid)

@sio.event
async def disconnect(sid):
    print("❌ socket disconnected:", sid)
