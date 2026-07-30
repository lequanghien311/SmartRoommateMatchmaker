function success(res, data = {}, message = 'Thao tác thành công', meta = {}, status = 200) {
  return res.status(status).json({ success: true, message, data, meta });
}

function noContent(res) {
  return res.status(204).send();
}

module.exports = { success, noContent };

