const bcrypt = require('bcryptjs');
const AuthService = require('../src/modules/auth/auth.service');
const AppError = require('../src/shared/errors/AppError');
const LocalMessagingProvider = require('../src/shared/providers/messaging/LocalMessagingProvider');

function repository(overrides = {}) {
  return {
    findDuplicate: jest.fn().mockResolvedValue(null),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn().mockImplementation(async (input) => ({
      id: '00000000-0000-4000-8000-000000000001',
      email: input.email,
      role: input.role,
    })),
    saveRefreshToken: jest.fn(),
    consumeRefreshToken: jest.fn(),
    revokeToken: jest.fn(),
    updatePassword: jest.fn(),
    markLogin: jest.fn(),
    ...overrides,
  };
}

describe('AuthService', () => {
  test('đăng ký hash mật khẩu và phát token', async () => {
    const repo = repository();
    const service = new AuthService(repo, new LocalMessagingProvider());
    const result = await service.register({
      email: 'new@example.com',
      phone: '0909999999',
      fullName: 'Người dùng mới',
      role: 'tenant',
      password: 'Password1',
    });
    expect(result.accessToken).toBeTruthy();
    expect(repo.create.mock.calls[0][0].passwordHash).not.toBe('Password1');
    expect(repo.saveRefreshToken).toHaveBeenCalled();
  });

  test('đăng ký báo conflict email', async () => {
    const repo = repository({ findDuplicate: jest.fn().mockResolvedValue({ email: 'used@example.com' }) });
    const service = new AuthService(repo, new LocalMessagingProvider());
    await expect(service.register({
      email: 'used@example.com',
      phone: '0909999999',
      fullName: 'Trùng Email',
      role: 'tenant',
      password: 'Password1',
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  test('đăng nhập hợp lệ', async () => {
    const hash = await bcrypt.hash('Password1', 4);
    const repo = repository({
      findByEmail: jest.fn().mockResolvedValue({
        id: '00000000-0000-4000-8000-000000000001',
        email: 'ok@example.com',
        role: 'tenant',
        status: 'active',
        password_hash: hash,
      }),
    });
    const result = await new AuthService(repo, new LocalMessagingProvider()).login('ok@example.com', 'Password1');
    expect(result.user.password_hash).toBeUndefined();
    expect(result.refreshToken).toBeTruthy();
  });

  test('đăng nhập sai mật khẩu trả 401', async () => {
    const repo = repository({ findByEmail: jest.fn().mockResolvedValue(null) });
    await expect(new AuthService(repo, new LocalMessagingProvider()).login('none@example.com', 'bad'))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  test('tài khoản locked không đăng nhập được', async () => {
    const hash = await bcrypt.hash('Password1', 4);
    const repo = repository({
      findByEmail: jest.fn().mockResolvedValue({
        id: '00000000-0000-4000-8000-000000000001',
        role: 'tenant',
        status: 'locked',
        password_hash: hash,
      }),
    });
    await expect(new AuthService(repo, new LocalMessagingProvider()).login('locked@example.com', 'Password1'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  test('AppError giữ lỗi theo field', () => {
    const error = new AppError('Sai', 422, [{ field: 'email', message: 'Email sai' }]);
    expect(error.errors[0].field).toBe('email');
  });
});

