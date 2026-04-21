const express = require("express");
const router = express.Router();
const timetableController = require("../controllers/timetableController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", timetableController.getTimetable);
router.post("/", timetableController.createTimetableEntry);
router.delete("/:id", timetableController.deleteTimetableEntry);

module.exports = router;
