class StorageProvider {
  async save(_file, _folder) {
    throw new Error('StorageProvider.save chưa được triển khai');
  }

  async delete(_key) {
    throw new Error('StorageProvider.delete chưa được triển khai');
  }

  async readBuffer(_key) {
    throw new Error('StorageProvider.readBuffer chưa được triển khai');
  }

  async health() {
    throw new Error('StorageProvider.health chưa được triển khai');
  }
}

module.exports = StorageProvider;

