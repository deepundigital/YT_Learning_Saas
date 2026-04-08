const Certificate = require("../models/Certificate");
const { generateCertificateId, normalizeCertificatePayload } = require("../services/certificateService");

async function listCertificates(req, res, next) {
  try {
    const certificates = await Certificate.find({ user: req.user._id }).sort({ completionDate: -1 });

    return res.status(200).json({
      ok: true,
      count: certificates.length,
      certificates
    });
  } catch (error) {
    next(error);
  }
}

async function createCertificate(req, res, next) {
  try {
    const payload = normalizeCertificatePayload(req.body);

    if (!payload.title || !payload.platform) {
      return res.status(400).json({
        ok: false,
        error: "title and platform are required"
      });
    }

    const certificate = await Certificate.create({
      user: req.user._id,
      ...payload,
      certificateId: generateCertificateId(payload.type === "platform" ? "PLCERT" : "EXTCERT")
    });

    return res.status(201).json({
      ok: true,
      message: "Certificate saved successfully",
      certificate
    });
  } catch (error) {
    next(error);
  }
}

async function verifyCertificate(req, res, next) {
  try {
    const certificate = await Certificate.findOne({
      certificateId: String(req.params.certificateId || "").trim()
    }).populate("user", "name email");

    if (!certificate) {
      return res.status(404).json({
        ok: false,
        error: "Certificate not found"
      });
    }

    return res.status(200).json({
      ok: true,
      certificate
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCertificate(req, res, next) {
  try {
    const deleted = await Certificate.findOneAndDelete({
      _id: req.params.certificateId,
      user: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: "Certificate not found"
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Certificate deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCertificates,
  createCertificate,
  verifyCertificate,
  deleteCertificate
};