import express from "express";
import { login } from "../controllers/authController.js";
const router = express.Router();

export default (db) => {
  router.post("/login", (req, res) => login(req, res, db));
  return router;
};
