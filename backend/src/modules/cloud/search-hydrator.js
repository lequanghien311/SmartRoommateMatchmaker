const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function hydrateAzureSearchRooms(db, searchResult) {
  if (searchResult?.provider !== 'azure-ai-search' || searchResult?.fallbackUsed !== false) {
    return searchResult;
  }

  const indexedResults = Array.isArray(searchResult.results) ? searchResult.results : [];
  const ids = [...new Set(indexedResults.map((room) => room.id).filter((id) => UUID_PATTERN.test(id)))];
  if (!ids.length) return { ...searchResult, results: [], resultCount: 0 };

  const currentRooms = await db.query(
    `SELECT r.*,
      COALESCE((SELECT json_agg(json_build_object('id',ri.id,'url',ri.url,'isCover',ri.is_cover)
        ORDER BY ri.sort_order) FROM room_images ri WHERE ri.room_id=r.id AND ri.deleted_at IS NULL),'[]') images,
      COALESCE((SELECT json_agg(a.name ORDER BY a.name) FROM room_amenities ra
        JOIN amenities a ON a.id=ra.amenity_id WHERE ra.room_id=r.id),'[]') amenities
     FROM rooms r
     WHERE r.id = ANY($1::uuid[]) AND r.status='active' AND r.deleted_at IS NULL`,
    [ids],
  );
  const byId = new Map(currentRooms.rows.map((room) => [room.id, room]));
  const results = indexedResults.flatMap((indexedRoom) => {
    const currentRoom = byId.get(indexedRoom.id);
    if (!currentRoom) return [];
    return [{ ...currentRoom, '@search.score': indexedRoom['@search.score'] }];
  });

  return { ...searchResult, results, resultCount: results.length, hydratedFrom: 'postgresql' };
}

module.exports = { hydrateAzureSearchRooms };
