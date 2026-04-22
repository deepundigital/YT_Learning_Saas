const express = require("express");
const router = express.Router();
const codingController = require("../controllers/codingController");
const auth = require("../middleware/auth");

router.use(auth);

router.post("/profiles", codingController.updateProfiles);
router.get("/stats", codingController.getDashboardStats);
router.post("/solve", codingController.markProblemSolved);
router.get("/social", codingController.getSocialLeaderboard);
router.get("/contests", codingController.getUpcomingContests);

module.exports = router;
