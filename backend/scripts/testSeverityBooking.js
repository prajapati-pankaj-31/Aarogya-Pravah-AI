/**
 * Test Severity Level Appointment Booking & Priority Engine Verification
 * Tests:
 * 1. Booking with Easy / Routine checkup (severityLevel = 'LOW' and 'Easy'/'EASY')
 * 2. Booking with Medium (severityLevel = 'MEDIUM')
 * 3. Booking with High (severityLevel = 'HIGH')
 * 4. Priority Engine scoring verification for LOW (10 pts), MEDIUM (25 pts), HIGH (50 pts)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const express = require('express');
const http = require('http');

const app = require('../src/app');
const Patient = require('../src/models/Patient');
const { Appointment } = require('../src/models/Appointment');
const { QueueEntry } = require('../src/models/QueueEntry');
const { calculatePriorityScore } = require('../src/services/priorityService');

const TEST_PORT = 5002;

async function runSeverityBookingTests() {
  console.log('================================================================');
  console.log('     AAROGYA PRAVAH AI — SEVERITY LEVEL APPOINTMENT TESTS       ');
  console.log('================================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aarogya_pravah_ai';
  await mongoose.connect(mongoUri);
  console.log(`✓ [MongoDB] Connected to ${mongoUri}`);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}`;
  console.log(`✓ [Test Server] Listening at ${baseUrl}\n`);

  let allPassed = true;

  try {
    const testCases = [
      {
        description: 'Case 1: Easy (Routine checkup) with canonical value LOW',
        payload: {
          name: 'Rohan Verma',
          age: 28,
          gender: 'Male',
          phoneNumber: '+91-9876540001',
          department: 'General Medicine',
          symptoms: 'Routine yearly wellness checkup and blood pressure check',
          severityLevel: 'LOW',
        },
        expectedReportedSeverity: 'LOW',
        expectedSeverityPoints: 10,
      },
      {
        description: 'Case 2: Easy with legacy string "Easy" (testing sanitizer compatibility)',
        payload: {
          name: 'Priya Sharma',
          age: 32,
          gender: 'Female',
          phoneNumber: '+91-9876540002',
          department: 'General Medicine',
          symptoms: 'Mild routine checkup',
          severityLevel: 'Easy',
        },
        expectedReportedSeverity: 'LOW',
        expectedSeverityPoints: 10,
      },
      {
        description: 'Case 3: Medium (Discomfort, non-urgent) with canonical value MEDIUM',
        payload: {
          name: 'Sunita Patel',
          age: 45,
          gender: 'Female',
          phoneNumber: '+91-9876540003',
          department: 'Cardiology',
          symptoms: 'Mild palpitations after climbing stairs, moderate discomfort',
          severityLevel: 'MEDIUM',
        },
        expectedReportedSeverity: 'MEDIUM',
        expectedSeverityPoints: 25,
      },
      {
        description: 'Case 4: High (Severe pain, urgent) with canonical value HIGH',
        payload: {
          name: 'Vikram Singh',
          age: 55,
          gender: 'Male',
          phoneNumber: '+91-9876540004',
          department: 'Cardiology',
          symptoms: 'Severe crushing chest pain radiating to left arm and jaw',
          severityLevel: 'HIGH',
        },
        expectedReportedSeverity: 'HIGH',
        expectedSeverityPoints: 50,
      },
      {
        description: 'Case 5: FormData upload with Easy (severityLevel = LOW)',
        isFormData: true,
        payload: {
          name: 'Neha Gupta',
          age: 26,
          gender: 'Female',
          phoneNumber: '+91-9876540005',
          department: 'General Medicine',
          symptoms: 'Annual health checkup and routine chest radiograph',
          severityLevel: 'LOW',
        },
        expectedReportedSeverity: 'LOW',
        expectedSeverityPoints: 10,
      },
    ];

    for (const tc of testCases) {
      console.log(`[TESTING] ${tc.description}...`);

      let res;
      if (tc.isFormData) {
        const formData = new FormData();
        Object.entries(tc.payload).forEach(([k, v]) => formData.append(k, String(v)));
        formData.append('medicalImageType', 'XRAY');
        // Attach tiny 1x1 test png buffer
        const testPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        formData.append('medicalImage', new Blob([testPng], { type: 'image/png' }), 'test_xray.png');

        res = await fetch(`${baseUrl}/api/patients/appointments`, {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch(`${baseUrl}/api/patients/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tc.payload),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        console.error(`  ✗ Booking failed with HTTP ${res.status}:`, data);
        allPassed = false;
        continue;
      }

      console.log(`  ✓ HTTP ${res.status} Success! Token: ${data.data.tokenNumber}`);
      console.log(`  ✓ Reported Severity in API response: ${data.data.reportedSeverity}`);

      if (data.data.reportedSeverity !== tc.expectedReportedSeverity) {
        console.error(`  ✗ Expected reportedSeverity to be '${tc.expectedReportedSeverity}', but got '${data.data.reportedSeverity}'`);
        allPassed = false;
      } else {
        console.log(`  ✓ Schema Enum match: ${data.data.reportedSeverity} === ${tc.expectedReportedSeverity}`);
      }

      // Verify in MongoDB directly
      const savedAppt = await Appointment.findOne({ tokenNumber: data.data.tokenNumber });
      if (!savedAppt || savedAppt.reportedSeverity !== tc.expectedReportedSeverity) {
        console.error(`  ✗ DB mismatch: Saved reportedSeverity is '${savedAppt?.reportedSeverity}'`);
        allPassed = false;
      } else {
        console.log(`  ✓ DB persistence match: '${savedAppt.reportedSeverity}' stored in MongoDB`);
      }

      // Verify Priority Engine calculation
      const priorityResult = calculatePriorityScore({
        reportedSeverity: savedAppt.reportedSeverity,
        isAccident: false,
        accidentSeverity: 'NONE',
        checkInTime: new Date(),
      });

      console.log(`  ✓ Priority Engine Severity Points: ${priorityResult.scoreBreakdown.clinicalSeverityPoints} (Expected: ${tc.expectedSeverityPoints})`);
      console.log(`  ✓ Final Calculated Priority Score: ${priorityResult.priorityScore} (${priorityResult.priorityLevel})\n`);

      if (priorityResult.scoreBreakdown.clinicalSeverityPoints !== tc.expectedSeverityPoints) {
        console.error(`  ✗ Priority point mismatch! Expected ${tc.expectedSeverityPoints}, got ${priorityResult.scoreBreakdown.clinicalSeverityPoints}`);
        allPassed = false;
      }
    }

    console.log('================================================================');
    if (allPassed) {
      console.log('🎉 ALL SEVERITY LEVEL BOOKING & PRIORITY TESTS PASSED (4/4)!');
    } else {
      console.log('❌ SOME SEVERITY LEVEL TESTS FAILED.');
    }
    console.log('================================================================\n');

  } catch (err) {
    console.error('Fatal Test Error:', err);
    allPassed = false;
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runSeverityBookingTests();
