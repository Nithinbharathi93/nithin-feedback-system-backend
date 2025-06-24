export async function giveFeedback(req, res, db) {
  if (req.user.role !== "manager") {
    return res.status(403).json({ msg: "Access denied" });
  }

  const { employeeId, strengths, improvements, sentiment } = req.body;

  try {
    await db.execute(
      `INSERT INTO feedback (employeeId, managerId, strengths, improvements, sentiment)
       VALUES (?, ?, ?, ?, ?)`,
      [employeeId, req.user.id, strengths, improvements, sentiment]
    );
    res.status(201).json({ msg: "Feedback submitted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateFeedback(req, res, db) {
  if (req.user.role !== "manager") {
    return res.status(403).json({ msg: "Access denied" });
  }

  const { strengths, improvements, sentiment } = req.body;
  const feedbackId = req.params.id;

  try {
    await db.execute(
      `UPDATE feedback
       SET strengths = ?, improvements = ?, sentiment = ?
       WHERE id = ? AND managerId = ?`,
      [strengths, improvements, sentiment, feedbackId, req.user.id]
    );
    res.json({ msg: "Feedback updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getFeedbackHistory(req, res, db) {
  const employeeId = parseInt(req.params.id);

  if (req.user.role === "employee" && req.user.id !== employeeId) {
    return res.status(403).json({ msg: "Access denied" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT * FROM feedback WHERE employeeId = ?`,
      [employeeId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getSingleFeedback(req, res, db) {
  if (req.user.role !== "manager") {
    return res.status(403).json({ msg: "Access denied" });
  }

  const feedbackId = req.params.id;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM feedback WHERE id = ? AND managerId = ?`,
      [feedbackId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ msg: "Feedback not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function acknowledgeFeedback(req, res, db) {
  if (req.user.role !== "employee") {
    return res.status(403).json({ msg: "Access denied" });
  }

  const feedbackId = req.params.id;

  try {
    await db.execute(
      `UPDATE feedback SET acknowledged = 1 WHERE id = ? AND employeeId = ?`,
      [feedbackId, req.user.id]
    );
    res.json({ msg: "Feedback acknowledged" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getManagerDashboard(req, res, db) {
  if (req.user.role !== "manager") {
    return res.status(403).json({ msg: "Access denied" });
  }

  try {
    const [rows] = await db.execute(`
      SELECT employeeId,
             COUNT(*) AS feedbackCount,
             SUM(sentiment = 'positive') AS positive,
             SUM(sentiment = 'neutral') AS neutral,
             SUM(sentiment = 'negative') AS negative
      FROM feedback
      WHERE managerId = ?
      GROUP BY employeeId
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getEmployeeDashboard(req, res, db) {
  if (req.user.role !== "employee") {
    return res.status(403).json({ msg: "Access denied" });
  }

  try {
    const [rows] = await db.execute(`
      SELECT * FROM feedback
      WHERE employeeId = ?
      ORDER BY timestamp DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
