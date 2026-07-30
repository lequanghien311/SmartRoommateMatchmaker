const MatchingProvider = require('./MatchingProvider');

class RuleBasedMatchingProvider extends MatchingProvider {
  timeToMinutes(value) {
    const [hours, minutes] = String(value).slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  }

  timeSimilarity(left, right) {
    const difference = Math.abs(this.timeToMinutes(left) - this.timeToMinutes(right));
    const cyclicDifference = Math.min(difference, 1440 - difference);
    return Math.max(0, 1 - cyclicDifference / 240);
  }

  scaleSimilarity(left, right) {
    return Math.max(0, 1 - Math.abs(Number(left) - Number(right)) / 4);
  }

  overlap(leftMin, leftMax, rightMin, rightMax) {
    const overlap = Math.max(0, Math.min(Number(leftMax), Number(rightMax)) - Math.max(Number(leftMin), Number(rightMin)));
    const span = Math.max(Number(leftMax), Number(rightMax)) - Math.min(Number(leftMin), Number(rightMin));
    return span === 0 ? 1 : overlap / span;
  }

  tokens(value) {
    return new Set(
      String(value || '')
        .toLocaleLowerCase('vi')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 2),
    );
  }

  keywordSimilarity(left, right) {
    const a = this.tokens(left);
    const b = this.tokens(right);
    if (!a.size || !b.size) return 0;
    const intersection = [...a].filter((word) => b.has(word));
    return intersection.length / new Set([...a, ...b]).size;
  }

  round(value) {
    return Math.round(value * 100) / 100;
  }

  async calculate(profile, candidate) {
    const sleepWake = ((this.timeSimilarity(profile.sleep_time, candidate.sleep_time)
      + this.timeSimilarity(profile.wake_time, candidate.wake_time)) / 2) * 20;
    const cleanliness = this.scaleSimilarity(profile.cleanliness, candidate.cleanliness) * 15;
    const noise = this.scaleSimilarity(profile.noise_tolerance, candidate.noise_tolerance) * 10;
    const smoking = (profile.smoking === candidate.smoking ? 1 : 0) * 10;
    const pets = (profile.has_pets === candidate.has_pets ? 1 : 0) * 5;
    const budget = this.overlap(profile.budget_min, profile.budget_max, candidate.budget_min, candidate.budget_max) * 10;
    const area = (
      profile.preferred_province === candidate.preferred_province
        ? profile.preferred_district === candidate.preferred_district ? 1 : 0.6
        : 0
    ) * 10;
    const genderCompatible = (
      (profile.preferred_gender === 'any' || profile.preferred_gender === candidate.gender)
      && (candidate.preferred_gender === 'any' || candidate.preferred_gender === profile.gender)
    );
    const gender = (genderCompatible ? 1 : 0) * 5;
    const school = (
      profile.school && candidate.school
      && profile.school.toLocaleLowerCase('vi') === candidate.school.toLocaleLowerCase('vi')
        ? 1 : 0
    ) * 5;
    const keywords = this.keywordSimilarity(profile.habits, candidate.habits) * 10;
    const breakdown = {
      sleepWake: this.round(sleepWake), cleanliness: this.round(cleanliness),
      noise: this.round(noise), smoking: this.round(smoking), pets: this.round(pets),
      budget: this.round(budget), area: this.round(area), gender: this.round(gender),
      school: this.round(school), keywords: this.round(keywords),
    };
    const totalScore = this.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0));
    const similarities = [];
    const conflicts = [];
    if (breakdown.sleepWake >= 14) similarities.push('Giờ giấc sinh hoạt khá tương đồng');
    else conflicts.push('Giờ ngủ hoặc giờ thức có chênh lệch');
    if (breakdown.cleanliness >= 10) similarities.push('Tiêu chuẩn sạch sẽ phù hợp');
    else conflicts.push('Khác biệt về mức độ sạch sẽ');
    if (breakdown.smoking === 10) similarities.push('Thói quen hút thuốc tương thích');
    else conflicts.push('Khác biệt về việc hút thuốc');
    if (breakdown.budget >= 5) similarities.push('Ngân sách có khoảng giao nhau');
    else conflicts.push('Ngân sách khó dung hòa');
    if (breakdown.area >= 6) similarities.push('Khu vực mong muốn phù hợp');
    else conflicts.push('Khu vực mong muốn khác nhau');
    return {
      totalScore,
      breakdown,
      similarities,
      conflicts,
      explanation: totalScore >= 80
        ? 'Mức độ tương thích cao, hai bạn có nhiều điểm chung để bắt đầu trò chuyện.'
        : totalScore >= 60
          ? 'Mức độ tương thích khá, nên trao đổi thêm về các điểm có thể xung đột.'
          : 'Mức độ tương thích trung bình hoặc thấp; hãy xem kỹ các tiêu chí trước khi quyết định.',
    };
  }
}

module.exports = RuleBasedMatchingProvider;

