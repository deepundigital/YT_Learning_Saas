function success(res, data = {}, message = "Success", status = 200) {
  return res.status(status).json({
    ok: true,
    message,
    ...data
  });
}

function failure(res, error = "Something went wrong", status = 500, details = undefined) {
  return res.status(status).json({
    ok: false,
    error,
    ...(details !== undefined ? { details } : {})
  });
}

module.exports = {
  success,
  failure
};