import express from "express";
import { getOverview, getActivityStats, getAllUsers, trackAction } from "../controllers/admin.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/overview",  protectRoute, requireAdmin, getOverview);
router.get("/activity",  protectRoute, requireAdmin, getActivityStats);
router.get("/users",     protectRoute, requireAdmin, getAllUsers);
router.post("/track",    trackAction); // public — called from frontend on page load

export default router;