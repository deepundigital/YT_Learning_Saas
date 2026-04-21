const Timetable = require("../models/Timetable");

exports.getTimetable = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const timetable = await Timetable.find({ userId }).sort({ dayOfWeek: 1, startTime: 1 });
    res.status(200).json({ ok: true, timetable });
  } catch (error) {
    next(error);
  }
};

exports.createTimetableEntry = async (req, res, next) => {
  try {
    const { dayOfWeek, subject, startTime, endTime } = req.body;
    const userId = req.user._id;

    if (dayOfWeek === undefined || !subject || !startTime || !endTime) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const entry = await Timetable.create({
      userId,
      dayOfWeek,
      subject,
      startTime,
      endTime
    });

    res.status(201).json({ ok: true, entry });
  } catch (error) {
    next(error);
  }
};

exports.deleteTimetableEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const entry = await Timetable.findOneAndDelete({ _id: id, userId });
    
    if (!entry) {
      return res.status(404).json({ ok: false, error: "Entry not found" });
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
};
