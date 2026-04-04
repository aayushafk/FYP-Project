import axios from 'axios';

const testEventId = '69860cfe169f84c1ccacefc5';
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 5000
});

async function testEndpoint() {
  try {
    console.log('Testing GET /api/events/:eventId...');
    console.log(`URL: http://localhost:5000/api/events/${testEventId}`);
    
    const response = await api.get(`/events/${testEventId}`);
    console.log('\n✅ Success!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response:', error.request);
      console.error('This usually means the server is not running or the URL is wrong');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testEndpoint();
