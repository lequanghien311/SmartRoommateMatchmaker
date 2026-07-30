const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../../config/env');
const AppError = require('../../shared/errors/AppError');

class AuthService {
  constructor(repository, messaging) {
    this.repository = repository;
    this.messaging = messaging;
  }

  createTokens(user) {
    const accessToken = jwt.sign({ role: user.role }, env.jwtSecret, {
      subject: user.id,
      expiresIn: env.jwtExpiresIn,
    });
    const refreshToken = jwt.sign({ type: 'refresh' }, env.refreshSecret, {
      subject: user.id,
      expiresIn: env.refreshExpiresIn,
    });
    return { accessToken, refreshToken };
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(input, correlationId) {
    const duplicate = await this.repository.findDuplicate(input.email, input.phone);
    if (duplicate) {
      const field = duplicate.email === input.email.toLowerCase() ? 'email' : 'phone';
      throw new AppError(
        field === 'email' ? 'Email đã tồn tại' : 'Số điện thoại đã tồn tại',
        409,
        [{ field, message: field === 'email' ? 'Email đã tồn tại' : 'Số điện thoại đã tồn tại' }],
      );
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.repository.create({ ...input, passwordHash });
    const tokens = this.createTokens(user);
    await this.repository.saveRefreshToken(
      user.id,
      this.hashToken(tokens.refreshToken),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );
    const event = this.messaging.createEvent?.('UserRegistered', 'auth', { userId: user.id }, correlationId);
    if (event) await this.messaging.publish(event);
    return { user, ...tokens };
  }

  async login(email, password) {
    const user = await this.repository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }
    if (user.status === 'locked') throw new AppError('Tài khoản đã bị khóa', 403);
    const tokens = this.createTokens(user);
    await this.repository.saveRefreshToken(
      user.id,
      this.hashToken(tokens.refreshToken),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );
    await this.repository.markLogin(user.id);
    const safeUser = { ...user };
    delete safeUser.password_hash;
    return { user: safeUser, ...tokens };
  }

  async refresh(refreshToken) {
    let payload;
    try {
      payload = jwt.verify(refreshToken, env.refreshSecret);
    } catch (_error) {
      throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401);
    }
    const record = await this.repository.consumeRefreshToken(this.hashToken(refreshToken));
    if (!record || record.user_id !== payload.sub) throw new AppError('Refresh token đã bị thu hồi', 401);
    const user = await this.repository.findById(payload.sub);
    if (!user || user.status === 'locked') throw new AppError('Tài khoản không còn hoạt động', 401);
    const tokens = this.createTokens(user);
    await this.repository.saveRefreshToken(
      user.id,
      this.hashToken(tokens.refreshToken),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );
    return tokens;
  }

  async logout(refreshToken) {
    if (refreshToken) await this.repository.revokeToken(this.hashToken(refreshToken));
  }

  async changePassword(userId, currentPassword, newPassword, email) {
    const user = await this.repository.findByEmail(email);
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      throw new AppError('Mật khẩu hiện tại không đúng', 400);
    }
    await this.repository.updatePassword(userId, await bcrypt.hash(newPassword, 12));
  }
}

module.exports = AuthService;
