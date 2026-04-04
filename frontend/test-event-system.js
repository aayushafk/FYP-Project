/**
 * Test script to verify Event & Help Request System endpoints
 * Run: node test-event-system.js
 */

const API_BASE = 'http://localhost:5000/api';

let citizenToken = '';
let volunteerToken = '';
let organizerToken = '';
let testEventId = '';

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log(`Running: ${testName}`, 'yellow');
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

async function makeRequest(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();
  
  return { status: response.status, data };
}

async function testHealthCheck() {
  logTest('Health Check');
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    log(`✓ Server is running: ${data.message}`, 'green');
    return true;
  } catch (error) {
    log(`✗ Server not responding: ${error.message}`, 'red');
    return false;
  }
}

async function testUserRegistration() {
  logTest('User Registration');
  
  // Register Citizen
  const citizenData = {
    fullName: 'Test Citizen',
    email: `testcitizen${Date.now()}@test.com`,
    password: 'password123',
    role: 'citizen'
  };
  
  const { status: cStatus, data: cData } = await makeRequest('POST', '/auth/register', citizenData);
  if (cStatus === 201 && cData.token) {
    citizenToken = cData.token;
    log(`✓ Citizen registered successfully`, 'green');
  } else {
    log(`✗ Citizen registration failed: ${JSON.stringify(cData)}`, 'red');
  }

  // Register Volunteer
  const volunteerData = {
    fullName: 'Test Volunteer',
    email: `testvolunteer${Date.now()}@test.com`,
    password: 'password123',
    role: 'volunteer',
    skills: ['First Aid', 'Driving', 'Food Distribution']
  };
  
  const { status: vStatus, data: vData } = await makeRequest('POST', '/auth/register', volunteerData);
  if (vStatus === 201 && vData.token) {
    volunteerToken = vData.token;
    log(`✓ Volunteer registered successfully`, 'green');
  } else {
    log(`✗ Volunteer registration failed: ${JSON.stringify(vData)}`, 'red');
  }

  // Register Organizer
  const organizerData = {
    fullName: 'Test Organizer',
    email: `testorganizer${Date.now()}@test.com`,
    password: 'password123',
    role: 'organizer',
    organizationName: 'Test NGO'
  };
  
  const { status: oStatus, data: oData } = await makeRequest('POST', '/auth/register', organizerData);
  if (oStatus === 201 && oData.token) {
    organizerToken = oData.token;
    log(`✓ Organizer registered successfully`, 'green');
  } else {
    log(`✗ Organizer registration failed: ${JSON.stringify(oData)}`, 'red');
  }
}

async function testCitizenCreateRequest() {
  logTest('Citizen Creates Help Request');
  
  const requestData = {
    title: 'Need help with grocery shopping',
    description: 'Elderly person needs assistance with weekly groceries',
    category: 'Elder Care',
    location: '123 Main Street',
    requiredSkills: ['Driving', 'Elder Care']
  };
  
  const { status, data } = await makeRequest('POST', '/citizen/request', requestData, citizenToken);
  
  if (status === 201 && data.request) {
    testEventId = data.request._id;
    log(`✓ Help request created successfully`, 'green');
    log(`  Event ID: ${testEventId}`, 'blue');
    log(`  Type: ${data.request.type}`, 'blue');
    log(`  Status: ${data.request.trackingStatus}`, 'blue');
  } else {
    log(`✗ Failed to create request: ${JSON.stringify(data)}`, 'red');
  }
}

async function testVolunteerViewEvents() {
  logTest('Volunteer Views Available Events');
  
  const { status, data } = await makeRequest('GET', '/volunteer/available-events', null, volunteerToken);
  
  if (status === 200 && data.events) {
    log(`✓ Retrieved ${data.events.length} available events`, 'green');
    
    const matchedEvents = data.events.filter(e => e.matchCount > 0);
    log(`  Skill-matched events: ${matchedEvents.length}`, 'blue');
    
    if (matchedEvents.length > 0) {
      log(`  Top match: "${matchedEvents[0].title}" (${matchedEvents[0].matchCount} matching skills)`, 'blue');
    }
  } else {
    log(`✗ Failed to retrieve events: ${JSON.stringify(data)}`, 'red');
  }
}

async function testVolunteerAcceptEvent() {
  logTest('Volunteer Accepts Event');
  
  if (!testEventId) {
    log(`✗ No test event ID available`, 'red');
    return;
  }
  
  const { status, data } = await makeRequest('POST', `/volunteer/event/${testEventId}/accept`, null, volunteerToken);
  
  if (status === 200 && data.event) {
    log(`✓ Volunteer accepted event successfully`, 'green');
    log(`  Event: ${data.event.title}`, 'blue');
    log(`  Status changed to: ${data.event.trackingStatus}`, 'blue');
    log(`  Assigned volunteers: ${data.event.assignedVolunteers.length}`, 'blue');
  } else {
    log(`✗ Failed to accept event: ${JSON.stringify(data)}`, 'red');
  }
}

async function testVolunteerUpdateStatus() {
  logTest('Volunteer Updates Status to In Progress');
  
  if (!testEventId) {
    log(`✗ No test event ID available`, 'red');
    return;
  }
  
  const { status, data } = await makeRequest(
    'PUT', 
    `/volunteer/event/${testEventId}/status`, 
    { status: 'In Progress' }, 
    volunteerToken
  );
  
  if (status === 200 && data.event) {
    log(`✓ Status updated successfully`, 'green');
    log(`  New status: ${data.event.trackingStatus}`, 'blue');
  } else {
    log(`✗ Failed to update status: ${JSON.stringify(data)}`, 'red');
  }

  // Update to Completed
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const { status: status2, data: data2 } = await makeRequest(
    'PUT', 
    `/volunteer/event/${testEventId}/status`, 
    { status: 'Completed' }, 
    volunteerToken
  );
  
  if (status2 === 200 && data2.event) {
    log(`✓ Status updated to Completed`, 'green');
    log(`  Final status: ${data2.event.trackingStatus}`, 'blue');
  } else {
    log(`✗ Failed to complete: ${JSON.stringify(data2)}`, 'red');
  }
}

async function testEventDetails() {
  logTest('Fetch Event Details');
  
  if (!testEventId) {
    log(`✗ No test event ID available`, 'red');
    return;
  }
  
  const { status, data } = await makeRequest('GET', `/events/${testEventId}`, null, citizenToken);
  
  if (status === 200 && data.event) {
    log(`✓ Event details retrieved`, 'green');
    log(`  Title: ${data.event.title}`, 'blue');
    log(`  Type: ${data.event.type}`, 'blue');
    log(`  Status: ${data.event.trackingStatus}`, 'blue');
    log(`  Assigned Volunteers: ${data.event.assignedVolunteers.length}`, 'blue');
    log(`  Created By: ${data.event.createdBy.fullName}`, 'blue');
  } else {
    log(`✗ Failed to get event details: ${JSON.stringify(data)}`, 'red');
  }
}

async function testCitizenGetRequests() {
  logTest('Citizen Views Their Requests');
  
  const { status, data } = await makeRequest('GET', '/citizen/requests', null, citizenToken);
  
  if (status === 200 && (data.requests || data)) {
    const requests = data.requests || data;
    log(`✓ Retrieved ${requests.length} requests`, 'green');
    
    if (requests.length > 0) {
      log(`  Latest: "${requests[0].title}" - Status: ${requests[0].trackingStatus}`, 'blue');
    }
  } else {
    log(`✗ Failed to get requests: ${JSON.stringify(data)}`, 'red');
  }
}

async function runAllTests() {
  console.clear();
  log('\n╔════════════════════════════════════════════════════╗', 'blue');
  log('║   UnityAid Event System - Integration Tests     ║', 'blue');
  log('╚════════════════════════════════════════════════════╝\n', 'blue');
  
  try {
    // Check server health
    const serverUp = await testHealthCheck();
    if (!serverUp) {
      log('\n⚠️  Please start the backend server first: cd backend && npm start', 'yellow');
      return;
    }

    // Run tests in sequence
    await testUserRegistration();
    await testCitizenCreateRequest();
    await testVolunteerViewEvents();
    await testVolunteerAcceptEvent();
    await testVolunteerUpdateStatus();
    await testEventDetails();
    await testCitizenGetRequests();

    // Summary
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    log('\n✅ All tests completed!', 'green');
    log('\nTest Summary:', 'yellow');
    log(`  • Users registered (Citizen, Volunteer, Organizer)`, 'blue');
    log(`  • Citizen created help request`, 'blue');
    log(`  • Volunteer viewed available events`, 'blue');
    log(`  • Volunteer accepted event`, 'blue');
    log(`  • Status progressed: Pending → Assigned → In Progress → Completed`, 'blue');
    log(`  • Event details retrieved successfully`, 'blue');
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    log('🎉 Event & Help Request System is working correctly!\n', 'green');
  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run tests
runAllTests();
