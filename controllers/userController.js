import bcrypt from "bcrypt";

export async function createUser(req, res, db) {
  const { username, name, password, role, teamName } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const [teamRows] = await db.execute("SELECT id FROM teams WHERE name = ?", [teamName]);
    const teamId = teamRows[0]?.id;
    if (!teamId) return res.status(400).json({ msg: "Invalid team name" });

    const [rows] = await db.execute(
      "INSERT INTO users (username, name, passwordHash, role, teamId) VALUES (?, ?, ?, ?, ?)",
      [username, name, hash, role, teamId]
    );
    res.status(201).json({ msg: "User created", userId: rows.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getProfile(req, res, db) {
  try {
    const [rows] = await db.execute(`
      SELECT u.id, u.username, u.name, u.role, t.name AS team 
      FROM users u 
      LEFT JOIN teams t ON u.teamId = t.id 
      WHERE u.id = ?`, [req.user.id]);
    if (!rows.length) return res.status(404).json({ msg: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getTeamMembers(req, res, db) {
  if (req.user.role !== "manager") {
    return res.status(403).json({ msg: "Access denied" });
  }

  try {
    const [[manager]] = await db.execute(
      "SELECT teamId FROM users WHERE id = ? AND role = 'manager'", [req.user.id]
    );
    if (!manager?.teamId) return res.status(404).json({ msg: "Manager/team not found" });

    const [rows] = await db.execute(
      "SELECT id, name, username FROM users WHERE teamId = ? AND id != ? AND role = 'employee'",
      [manager.teamId, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
