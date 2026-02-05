from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=6, max_length=128)


# שימי לב:
# OAuth2PasswordBearer (Flow password) לא משתמש ב-LoginRequest,
# הוא משתמש ב-OAuth2PasswordRequestForm (Form-Data).
# אבל נשאיר את זה אם את רוצה גם Login דרך JSON בעתיד.
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
