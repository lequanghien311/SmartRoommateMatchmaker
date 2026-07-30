const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const StorageProvider = require('./StorageProvider');

class LocalStorageProvider extends StorageProvider {
  constructor(rootDirectory) {
    super();
    this.rootDirectory = path.resolve(rootDirectory);
  }

  async save(file, folder = 'rooms') {
    const extension = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[file.mimetype];
    const key = path.posix.join(folder, `${randomUUID()}${extension}`);
    const destination = path.resolve(this.rootDirectory, ...key.split('/'));
    if (!destination.startsWith(this.rootDirectory + path.sep)) throw new Error('Đường dẫn lưu trữ không hợp lệ');
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, file.buffer);
    return { key, url: `/uploads/${key}` };
  }

  async delete(key) {
    const target = path.resolve(this.rootDirectory, ...key.split('/'));
    if (!target.startsWith(this.rootDirectory + path.sep)) throw new Error('Đường dẫn lưu trữ không hợp lệ');
    await fs.rm(target, { force: true });
  }

  async health() {
    await fs.mkdir(this.rootDirectory, { recursive: true });
    await fs.access(this.rootDirectory);
    return { status: 'healthy', provider: 'local' };
  }
}

module.exports = LocalStorageProvider;

