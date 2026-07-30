class MatchingProvider {
  async calculate(_profile, _candidate) {
    throw new Error('MatchingProvider.calculate chưa được triển khai');
  }
}

module.exports = MatchingProvider;

