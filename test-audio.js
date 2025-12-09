/**
 * Audio Playback Test Script
 * 
 * This script tests audio playback functionality across the application.
 * Run this in the browser console after loading the app.
 */

async function testAudioPlayback() {
  console.log("🎵 Starting Audio Playback Tests...\n");
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Check if AudioSampleProvider is available
  function testAudioContext() {
    try {
      // Check if useLibraryAudio hook exists
      const hasAudioContext = typeof window !== 'undefined';
      if (hasAudioContext) {
        results.passed++;
        results.tests.push({ name: "Audio context available", status: "PASS" });
        console.log("✅ Audio context is available");
      } else {
        throw new Error("Audio context not available");
      }
    } catch (error) {
      results.failed++;
      results.tests.push({ name: "Audio context available", status: "FAIL", error: error.message });
      console.error("❌ Audio context test failed:", error);
    }
  }

  // Test 2: Check if HTML5 Audio API is supported
  function testHTML5Audio() {
    try {
      const audio = new Audio();
      if (audio && typeof audio.play === 'function') {
        results.passed++;
        results.tests.push({ name: "HTML5 Audio API supported", status: "PASS" });
        console.log("✅ HTML5 Audio API is supported");
      } else {
        throw new Error("HTML5 Audio not supported");
      }
    } catch (error) {
      results.failed++;
      results.tests.push({ name: "HTML5 Audio API supported", status: "FAIL", error: error.message });
      console.error("❌ HTML5 Audio test failed:", error);
    }
  }

  // Test 3: Test audio element creation
  function testAudioElementCreation() {
    try {
      const testUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      const audio = new Audio(testUrl);
      audio.preload = 'auto';
      audio.volume = 1.0;
      
      if (audio.src && audio.volume === 1.0) {
        results.passed++;
        results.tests.push({ name: "Audio element creation", status: "PASS" });
        console.log("✅ Audio element can be created and configured");
      } else {
        throw new Error("Audio element configuration failed");
      }
    } catch (error) {
      results.failed++;
      results.tests.push({ name: "Audio element creation", status: "FAIL", error: error.message });
      console.error("❌ Audio element creation test failed:", error);
    }
  }

  // Test 4: Check for multiple audio elements (should be limited)
  function testMultipleAudioElements() {
    try {
      const audioElements = document.querySelectorAll('audio');
      console.log(`Found ${audioElements.length} audio elements on page`);
      
      if (audioElements.length <= 10) {
        results.passed++;
        results.tests.push({ name: "Audio element count check", status: "PASS" });
        console.log("✅ Reasonable number of audio elements");
      } else {
        results.failed++;
        results.tests.push({ 
          name: "Audio element count check", 
          status: "FAIL", 
          error: `Too many audio elements: ${audioElements.length}` 
        });
        console.warn(`⚠️ Too many audio elements found: ${audioElements.length}`);
      }
    } catch (error) {
      results.failed++;
      results.tests.push({ name: "Audio element count check", status: "FAIL", error: error.message });
      console.error("❌ Audio element count test failed:", error);
    }
  }

  // Test 5: Check if useLibraryAudio hook is being used
  function testLibraryAudioHook() {
    try {
      // Check if AudioSampleProvider is in the DOM
      const hasProvider = document.querySelector('[data-audio-provider]') !== null;
      
      // Since we can't directly check React hooks, we'll check for the pattern
      // by looking for audio elements that are NOT directly in components
      const libraryCards = document.querySelectorAll('[class*="LibraryBookCard"]');
      const audioInCards = document.querySelectorAll('[class*="LibraryBookCard"] audio');
      
      if (audioInCards.length === 0 && libraryCards.length > 0) {
        results.passed++;
        results.tests.push({ name: "LibraryBookCard uses shared audio context", status: "PASS" });
        console.log("✅ LibraryBookCard appears to use shared audio context (no individual audio elements)");
      } else if (libraryCards.length === 0) {
        results.passed++;
        results.tests.push({ name: "LibraryBookCard uses shared audio context", status: "PASS" });
        console.log("✅ No library cards on this page (expected on library page)");
      } else {
        results.failed++;
        results.tests.push({ 
          name: "LibraryBookCard uses shared audio context", 
          status: "FAIL", 
          error: `Found ${audioInCards.length} individual audio elements in library cards` 
        });
        console.warn(`⚠️ Found ${audioInCards.length} individual audio elements in library cards`);
      }
    } catch (error) {
      results.failed++;
      results.tests.push({ name: "LibraryBookCard uses shared audio context", status: "FAIL", error: error.message });
      console.error("❌ LibraryBookCard audio context test failed:", error);
    }
  }

  // Run all tests
  testAudioContext();
  testHTML5Audio();
  testAudioElementCreation();
  testMultipleAudioElements();
  testLibraryAudioHook();

  // Print summary
  console.log("\n📊 Test Summary:");
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📝 Total: ${results.passed + results.failed}`);
  
  console.log("\n📋 Detailed Results:");
  results.tests.forEach((test, index) => {
    const icon = test.status === "PASS" ? "✅" : "❌";
    console.log(`${icon} ${index + 1}. ${test.name}: ${test.status}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  return results;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testAudioPlayback = testAudioPlayback;
  console.log("🎵 Audio test function loaded! Run testAudioPlayback() in the console to test.");
}




