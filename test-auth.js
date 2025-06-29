#!/usr/bin/env node

/**
 * Simple test script to verify the authentication system
 * Run with: node test-auth.js
 */

import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const testData = {
  email: "test@example.com",
  password: "TestPassword123!",
  name: "Test User",
};

let cookies = "";

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookies,
        ...headers,
      },
      withCredentials: true,
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);

    // Extract cookies from response
    if (response.headers["set-cookie"]) {
      cookies = response.headers["set-cookie"].join("; ");
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `${error.response.status}: ${JSON.stringify(error.response.data)}`
      );
    }
    throw error;
  }
}

async function runTests() {
  console.log("🚀 Testing Authentication System...\n");

  try {
    // Test 1: Health check
    console.log("1. Testing health endpoint...");
    const health = await makeRequest("GET", "/health");
    console.log("✅ Health check passed:", health.status);

    // Test 2: API info
    console.log("\n2. Testing API info...");
    const apiInfo = await makeRequest("GET", "/");
    console.log("✅ API info retrieved:", apiInfo.message);

    // Test 3: Register new user
    console.log("\n3. Testing user registration...");
    const registerResult = await makeRequest(
      "POST",
      "/auth/register",
      testData
    );
    console.log("✅ Registration successful:", registerResult.message);
    console.log("   User ID:", registerResult.user._id);

    // Test 4: Get current user (should be logged in after registration)
    console.log("\n4. Testing get current user...");
    const currentUser = await makeRequest("GET", "/auth/me");
    console.log("✅ Current user retrieved:", currentUser.user.email);

    // Test 5: Logout
    console.log("\n5. Testing logout...");
    const logoutResult = await makeRequest("POST", "/auth/logout");
    console.log("✅ Logout successful:", logoutResult.message);

    // Test 6: Try to access protected route (should fail)
    console.log("\n6. Testing protected route after logout...");
    try {
      await makeRequest("GET", "/auth/me");
      console.log("❌ This should have failed!");
    } catch (error) {
      console.log("✅ Protected route correctly blocked:", error.message);
    }

    // Test 7: Login with credentials
    console.log("\n7. Testing login...");
    const loginResult = await makeRequest("POST", "/auth/login", {
      email: testData.email,
      password: testData.password,
    });
    console.log("✅ Login successful:", loginResult.message);

    // Test 8: Get current user again (should work after login)
    console.log("\n8. Testing get current user after login...");
    const currentUser2 = await makeRequest("GET", "/auth/me");
    console.log("✅ Current user retrieved again:", currentUser2.user.email);

    console.log(
      "\n🎉 All tests passed! Authentication system is working correctly."
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get(BASE_URL + "/health");
    console.log("✅ Server is running");
    return true;
  } catch (error) {
    console.log(
      "❌ Server is not running. Please start the server first with: npm run dev"
    );
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

main();
