const { SearchIndexClient, SearchClient, AzureKeyCredential } = require('@azure/search-documents');

async function syncAzureSearch() {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT || 'https://srch-smartroommate-ea.search.windows.net';
  const apiKey = process.env.AZURE_SEARCH_KEY;

  if (!apiKey) {
    console.error('Lỗi: Thiếu AZURE_SEARCH_KEY trong biến môi trường');
    process.exit(1);
  }

  const credential = new AzureKeyCredential(apiKey);
  const indexClient = new SearchIndexClient(endpoint, credential);
  const indexName = 'rooms-index';

  console.log(`Kiểm tra index ${indexName} trên ${endpoint}...`);

  let exists = false;
  try {
    await indexClient.getIndex(indexName);
    exists = true;
    console.log(`Index ${indexName} đã tồn tại.`);
  } catch (_err) {
    console.log(`Index ${indexName} chưa tồn tại. Đang tạo schema mới...`);
  }

  if (!exists) {
    const roomIndexSchema = {
      name: indexName,
      fields: [
        { name: 'id', type: 'Edm.String', key: true, filterable: true, sortable: true },
        { name: 'title', type: 'Edm.String', searchable: true, filterable: true, sortable: true },
        { name: 'description', type: 'Edm.String', searchable: true },
        { name: 'price', type: 'Edm.Double', filterable: true, sortable: true },
        { name: 'address', type: 'Edm.String', searchable: true },
      ],
    };
    await indexClient.createIndex(roomIndexSchema);
    console.log(`Đã tạo index ${indexName} thành công.`);
  }

  const searchClient = new SearchClient(endpoint, indexName, credential);
  const demoDocs = [
    {
      id: '6c78d8e1-87f0-4b76-b292-badc2b30b21c',
      title: 'Phòng trọ sinh viên tiện nghi số 1',
      description: 'Không gian sáng thoáng, an ninh, gần trường và đầy đủ tiện ích cho sinh viên số 1.',
      price: 3500000,
      address: 'Quận 1, Hồ Chí Minh',
    },
    {
      id: '7d89e9f2-98f1-5c87-c303-cbed3c41c32d',
      title: 'Căn hộ chung cư ở ghép Quận 7',
      description: 'Phòng rộng rãi sạch đẹp, có máy lạnh, giờ giấc tự do gần Đại học TĐT.',
      price: 4000000,
      address: 'Quận 7, Hồ Chí Minh',
    },
  ];

  console.log(`Đang nạp ${demoDocs.length} tài liệu phòng mẫu lên index ${indexName}...`);
  const uploadResult = await searchClient.uploadDocuments(demoDocs);
  console.log(`Kết quả đồng bộ: ${uploadResult.results.length} tài liệu đã được gửi.`);
}

if (require.main === module) {
  syncAzureSearch().catch((err) => {
    console.error('Lỗi khi đồng bộ Azure Search:', err.message);
    process.exit(1);
  });
}

module.exports = syncAzureSearch;
