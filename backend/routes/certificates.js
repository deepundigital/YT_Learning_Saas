const express = require("express");
const auth = require("../middleware/auth");
const { validateObjectIdField } = require("../middleware/validate");
const certificateController = require("../controllers/certificateController");

const router = express.Router();

router.get("/", auth, certificateController.listCertificates);
router.post("/", auth, certificateController.createCertificate);
router.get("/verify/:certificateId", certificateController.verifyCertificate);
router.delete(
  "/:certificateId",
  auth,
  validateObjectIdField("certificateId"),
  certificateController.deleteCertificate
);

module.exports = router;