class RoommateProfilesRepository {
  constructor(db) {
    this.db = db;
  }

  async getByUser(userId) {
    const result = await this.db.query(
      `SELECT rp.*,u.full_name,u.gender,u.avatar_url,u.status AS user_status
       FROM roommate_profiles rp JOIN users u ON u.id=rp.user_id WHERE rp.user_id=$1`,
      [userId],
    );
    return result.rows[0] || null;
  }

  async upsert(userId, input) {
    const result = await this.db.query(
      `INSERT INTO roommate_profiles(
        user_id,budget_min,budget_max,preferred_province,preferred_district,sleep_time,wake_time,
        smoking,has_pets,cleanliness,noise_tolerance,cooking_frequency,preferred_gender,school,habits,is_looking
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (user_id) DO UPDATE SET
        budget_min=EXCLUDED.budget_min,budget_max=EXCLUDED.budget_max,
        preferred_province=EXCLUDED.preferred_province,preferred_district=EXCLUDED.preferred_district,
        sleep_time=EXCLUDED.sleep_time,wake_time=EXCLUDED.wake_time,smoking=EXCLUDED.smoking,
        has_pets=EXCLUDED.has_pets,cleanliness=EXCLUDED.cleanliness,
        noise_tolerance=EXCLUDED.noise_tolerance,cooking_frequency=EXCLUDED.cooking_frequency,
        preferred_gender=EXCLUDED.preferred_gender,school=EXCLUDED.school,habits=EXCLUDED.habits,
        is_looking=EXCLUDED.is_looking,updated_at=NOW()
      RETURNING *`,
      [
        userId, input.budgetMin, input.budgetMax, input.preferredProvince, input.preferredDistrict,
        input.sleepTime, input.wakeTime, Boolean(input.smoking), Boolean(input.hasPets),
        input.cleanliness, input.noiseTolerance, input.cookingFrequency, input.preferredGender || 'any',
        input.school, input.habits, input.isLooking !== false,
      ],
    );
    return result.rows[0];
  }
}

module.exports = RoommateProfilesRepository;

