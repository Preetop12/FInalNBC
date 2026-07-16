// MongoDB Atlas Data API client configuration
const endpoint = import.meta.env.VITE_MONGODB_ENDPOINT || '';
const apiKey = import.meta.env.VITE_MONGODB_API_KEY || '';
const database = import.meta.env.VITE_MONGODB_DATABASE || 'nobrokercars';
const dataSource = import.meta.env.VITE_MONGODB_DATA_SOURCE || 'Cluster0';

export const isMongoConfigured = () => {
  if (!endpoint || !apiKey || endpoint.includes('placeholder') || apiKey.includes('placeholder') || apiKey.startsWith('mongo_api_key')) {
    return false;
  }
  return true;
};

if (!isMongoConfigured()) {
  console.warn(
    '⚠️ MongoDB Atlas Data API credentials are not configured! ' +
    'Please copy .env.example to .env and fill in VITE_MONGODB_ENDPOINT and VITE_MONGODB_API_KEY. ' +
    'Falling back to browser Local Storage mode.'
  );
}

/**
 * Perform a query using the MongoDB Atlas Data API
 * @param {string} action - e.g. 'find', 'findOne', 'insertOne', 'updateOne', 'deleteOne'
 * @param {string} collection - The collection name
 * @param {object} body - Query filters, projections, or document payload
 */
export const mongoFetch = async (action, collection, body = {}) => {
  if (!isMongoConfigured()) {
    throw new Error('MongoDB configuration is missing.');
  }

  const url = `${endpoint.replace(/\/$/, '')}/action/${action}`;
  
  const payload = {
    dataSource,
    database,
    collection,
    ...body
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Request-Headers': '*',
      'api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MongoDB Data API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return result;
};
