from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str
    requires_2fa: Optional[bool] = None


class TokenData(BaseModel):
    username: str | None = None