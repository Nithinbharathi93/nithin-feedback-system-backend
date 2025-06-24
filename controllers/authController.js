import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const jwtSecret = "hey-there";

export async function login(req, res, db) {
  const { username, password } = req.body;
  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);
    const user = rows[0];
    if (!user) return res.status(401).json({ msg: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role, teamId: user.teamId }, jwtSecret);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
