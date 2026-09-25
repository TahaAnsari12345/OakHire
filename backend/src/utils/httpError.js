/** Error carrying an HTTP status; the central error handler reads `status`. */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
