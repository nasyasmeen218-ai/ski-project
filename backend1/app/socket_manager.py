import socketio

# אנחנו יוצרים שרת סוקט "נקי" בלי הגדרות CORS פנימיות
# כדי למנוע את הכפילות שראינו בשגיאה
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[] 
)

socket_app = socketio.ASGIApp(
    sio,
    socketio_path='socket.io' # בלי סלאש בהתחלה
)