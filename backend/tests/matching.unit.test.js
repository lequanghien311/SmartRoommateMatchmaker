const RuleBasedMatchingProvider = require('../src/modules/matching/providers/RuleBasedMatchingProvider');

const base = {
  sleep_time: '23:00',
  wake_time: '06:30',
  cleanliness: 4,
  noise_tolerance: 3,
  smoking: false,
  has_pets: false,
  budget_min: 2000000,
  budget_max: 4000000,
  preferred_province: 'TP. Hồ Chí Minh',
  preferred_district: 'Bình Thạnh',
  preferred_gender: 'any',
  gender: 'female',
  school: 'HUTECH',
  habits: 'thích nấu ăn thể thao đọc sách cuối tuần',
};

describe('RuleBasedMatchingProvider', () => {
  const provider = new RuleBasedMatchingProvider();

  test('hai hồ sơ giống nhau đạt 100 điểm', async () => {
    const result = await provider.calculate(base, { ...base, gender: 'male' });
    expect(result.totalScore).toBe(100);
    expect(result.breakdown.sleepWake).toBe(20);
  });

  test('điểm luôn nằm trong khoảng 0 đến 100', async () => {
    const result = await provider.calculate(base, {
      ...base,
      sleep_time: '12:00',
      wake_time: '14:00',
      cleanliness: 1,
      noise_tolerance: 5,
      smoking: true,
      has_pets: true,
      budget_min: 10000000,
      budget_max: 12000000,
      preferred_province: 'Hà Nội',
      preferred_district: 'Cầu Giấy',
      school: 'Khác',
      habits: 'karaoke tiệc đêm',
    });
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  test('phát hiện giao ngân sách', async () => {
    const result = await provider.calculate(base, {
      ...base,
      budget_min: 3000000,
      budget_max: 5000000,
    });
    expect(result.breakdown.budget).toBeGreaterThan(0);
  });

  test('so sánh giờ có tính chu kỳ qua nửa đêm', () => {
    expect(provider.timeSimilarity('23:30', '00:30')).toBeGreaterThan(0.7);
  });

  test('từ khóa tiếng Việt được chuẩn hóa dấu', () => {
    expect(provider.keywordSimilarity('thích nấu ăn', 'nau an cuối tuần')).toBeGreaterThan(0);
  });
});

