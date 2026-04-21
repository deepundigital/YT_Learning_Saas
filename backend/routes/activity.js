const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/complete-task", activityController.completeTask);
router.get("/streak", activityController.getStreak);

module.exports = router;
