const express = require("express");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  return res.status(200).json({
    ok: true,
    user: req.user
  });
});

module.exports = router;