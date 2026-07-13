import express from "express";
import { getOverview, getActivityStats, getAllUsers, trackAction } from "../controllers/admin.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/overview",  protectRoute, getOverview);
router.get("/activity",  protectRoute, getActivityStats);
router.get("/users",     protectRoute, getAllUsers);
router.post("/track",    trackAction); // public — called from frontend on page load

export default router;