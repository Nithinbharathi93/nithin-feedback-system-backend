import os
import jwt
import datetime
from flask import request

JWT_SECRET = os.getenv("JWT_SECRET", "fallback-secret")

def generate_token(user):
    payload = {
        "id": user["id"],
        "role": user["role"],
        "teamId": user["teamId"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.split(" ")[1]
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None