import express from "express";
import {
  giveFeedback,
  updateFeedback,
  getFeedbackHistory,
  getSingleFeedback,
  acknowledgeFeedback,
  getManagerDashboard,
  getEmployeeDashboard,
} from "../controllers/feedbackController.js";

const router = express.Router();

export default (db, auth) => {
  router.post("/", auth, (req, res) => giveFeedback(req, res, db));
  router.put("/:id", auth, (req, res) => updateFeedback(req, res, db));
  router.get("/history/:id", auth, (req, res) => getFeedbackHistory(req, res, db));
  router.get("/single/:id", auth, (req, res) => getSingleFeedback(req, res, db));
  router.put("/ack/:id", auth, (req, res) => acknowledgeFeedback(req, res, db));
  router.get("/dashboard/manager", auth, (req, res) => getManagerDashboard(req, res, db));
  router.get("/dashboard/employee", auth, (req, res) => getEmployeeDashboard(req, res, db));
  return router;
};
