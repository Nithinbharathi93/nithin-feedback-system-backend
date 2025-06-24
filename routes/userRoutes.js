import express from "express";
import {
  createUser,
  getProfile,
  getTeamMembers
} from "../controllers/userController.js";

const router = express.Router();

export default (db, auth) => {
    router.post("/", (req, res) => createUser(req, res, db));
    router.get("/me", auth, (req, res) => getProfile(req, res, db));
    router.get("/team", auth, (req, res) => getTeamMembers(req, res, db));
    return router;
};
