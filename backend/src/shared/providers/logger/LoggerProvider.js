class LoggerProvider {
  info(_event, _context) {
    throw new Error('LoggerProvider.info chưa được triển khai');
  }

  warn(_event, _context) {
    throw new Error('LoggerProvider.warn chưa được triển khai');
  }

  error(_event, _context) {
    throw new Error('LoggerProvider.error chưa được triển khai');
  }
}

module.exports = LoggerProvider;

