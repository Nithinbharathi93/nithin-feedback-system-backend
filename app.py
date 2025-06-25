import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt
from db import init_db, get_db
from auth import generate_token, verify_token
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

init_db()

PORT = int(os.getenv("PORT", 3000))

@app.route("/", methods=["GET"])
def root():
    return jsonify({ "msg": "hey there" })

@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.json
    conn = get_db()
    cur = conn.cursor()

    team = cur.execute("SELECT id FROM teams WHERE name = ?", (data["teamName"],)).fetchone()
    if not team:
        return jsonify({ "msg": "Invalid team name" }), 400

    hashed = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt())

    try:
        cur.execute("""
            INSERT INTO users (username, name, passwordHash, role, teamId)
            VALUES (?, ?, ?, ?, ?)
        """, (data["username"], data["name"], hashed, data["role"], team["id"]))
        conn.commit()
        return jsonify({ "msg": "User created", "userId": cur.lastrowid }), 201
    except Exception as e:
        return jsonify({ "error": str(e) }), 500

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    conn = get_db()
    cur = conn.cursor()

    user = cur.execute("SELECT * FROM users WHERE username = ?", (data["username"],)).fetchone()
    if not user:
        return jsonify({ "msg": "Invalid username or password" }), 401

    if not bcrypt.checkpw(data["password"].encode(), user["passwordHash"]):
        return jsonify({ "msg": "Invalid username or password" }), 401

    token = generate_token(user)
    return jsonify({ "token": token, "user": { "id": user["id"], "name": user["name"], "role": user["role"] }})

@app.route("/api/users/me", methods=["GET"])
def user_me():
    user = verify_token(request)
    if not user:
        return jsonify({ "msg": "Unauthorized" }), 401

    conn = get_db()
    data = conn.execute("""
        SELECT u.id, u.username, u.name, u.role, t.name AS team 
        FROM users u 
        LEFT JOIN teams t ON u.teamId = t.id 
        WHERE u.id = ?
    """, (user["id"],)).fetchone()

    return jsonify(dict(data)) if data else (jsonify({ "msg": "User not found" }), 404)

@app.route("/api/users/team", methods=["GET"])
def team_members():
    user = verify_token(request)
    if not user or user["role"] != "manager":
        return jsonify({ "msg": "Access denied" }), 403

    conn = get_db()
    members = conn.execute("""
        SELECT id, name, username 
        FROM users 
        WHERE teamId = ? AND id != ? AND role = 'employee'
    """, (user["teamId"], user["id"])).fetchall()

    return jsonify([dict(m) for m in members])

@app.route("/api/feedback", methods=["POST"])
def create_feedback():
    user = verify_token(request)
    if not user or user["role"] != "manager":
        return jsonify({ "msg": "Access denied" }), 403

    data = request.json
    conn = get_db()
    conn.execute("""
        INSERT INTO feedback (employeeId, managerId, strengths, improvements, sentiment)
        VALUES (?, ?, ?, ?, ?)
    """, (data["employeeId"], user["id"], data["strengths"], data["improvements"], data["sentiment"]))
    conn.commit()
    return jsonify({ "msg": "Feedback submitted" }), 201

@app.route("/api/feedback/history/<int:id>", methods=["GET"])
def feedback_history(id):
    user = verify_token(request)
    if not user or (user["role"] == "employee" and user["id"] != id):
        return jsonify({ "msg": "Access denied" }), 403

    conn = get_db()
    rows = conn.execute("SELECT * FROM feedback WHERE employeeId = ?", (id,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/feedback/<int:id>", methods=["PUT"])
def edit_feedback(id):
    user = verify_token(request)
    if not user or user["role"] != "manager":
        return jsonify({ "msg": "Access denied" }), 403

    data = request.json
    conn = get_db()
    conn.execute("""
        UPDATE feedback 
        SET strengths = ?, improvements = ?, sentiment = ? 
        WHERE id = ? AND managerId = ?
    """, (data["strengths"], data["improvements"], data["sentiment"], id, user["id"]))
    conn.commit()
    return jsonify({ "msg": "Feedback updated" })

@app.route("/api/feedback/single/<int:id>", methods=["GET"])
def get_single_feedback(id):
    user = verify_token(request)
    if not user or user["role"] != "manager":
        return jsonify({ "msg": "Access denied" }), 403

    row = get_db().execute("""
        SELECT * FROM feedback 
        WHERE id = ? AND managerId = ?
    """, (id, user["id"])).fetchone()

    return jsonify(dict(row)) if row else (jsonify({ "msg": "Feedback not found" }), 404)

@app.route("/api/feedback/ack/<int:id>", methods=["PUT"])
def acknowledge_feedback(id):
    user = verify_token(request)
    if not user or user["role"] != "employee":
        return jsonify({ "msg": "Access denied" }), 403

    conn = get_db()
    conn.execute("UPDATE feedback SET acknowledged = 1 WHERE id = ? AND employeeId = ?", (id, user["id"]))
    conn.commit()
    return jsonify({ "msg": "Feedback acknowledged" })

@app.route("/api/dashboard/manager", methods=["GET"])
def manager_dashboard():
    user = verify_token(request)
    if not user or user["role"] != "manager":
        return jsonify({ "msg": "Access denied" }), 403

    rows = get_db().execute("""
        SELECT employeeId,
            COUNT(*) as feedbackCount,
            SUM(sentiment = 'positive') as positive,
            SUM(sentiment = 'neutral') as neutral,
            SUM(sentiment = 'negative') as negative
        FROM feedback
        WHERE managerId = ?
        GROUP BY employeeId
    """, (user["id"],)).fetchall()

    return jsonify([dict(r) for r in rows])

@app.route("/api/dashboard/employee", methods=["GET"])
def employee_dashboard():
    user = verify_token(request)
    if not user or user["role"] != "employee":
        return jsonify({ "msg": "Access denied" }), 403

    rows = get_db().execute("""
        SELECT * FROM feedback 
        WHERE employeeId = ? 
        ORDER BY timestamp DESC
    """, (user["id"],)).fetchall()

    return jsonify([dict(r) for r in rows])

if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=True)