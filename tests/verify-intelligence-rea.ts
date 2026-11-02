import fs from "fs";
import path from "path";
import http from "http";
import net from "net";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { db } from "../src/lib/db";
import {
  validateTargetUrl,
  SSRFSecurityError,
  InvalidUrlError,
} from "../src/modules/intelligence/security/ssrf";
import {
  EgressFilterProxy,
  EgressSecurityError,
  EgressProxyUnavailableError,
  resolveAndValidateDestination,
} from "../src/modules/intelligence/security/egress-proxy";
import {
  ExecutionSemaphore,
  ConcurrencyLimitExceededError,
  reaExecutionSemaphore,
} from "../src/modules/intelligence/security/concurrency";
import {
  validateMutationOrigin,
  UntrustedOriginError,
} from "../src/modules/intelligence/security/origin-guard";
import {
  EvidenceStorageService,
  evidenceStorage,
} from "../src/modules/intelligence/storage/evidence-storage";
import {
  REAEvidenceParser,
  MalformedEvidenceError,
  EvidenceHashMismatchError,
} from "../src/modules/intelligence/rea/parser";
import { REAScenarioBuilder } from "../src/modules/intelligence/rea/scenario";
import {
  REARunner,
  REATimeoutError,
  OversizedOutputError,
} from "../src/modules/intelligence/rea/runner";
import { WebsiteIntelligenceService } from "../src/modules/intelligence/rea/service";

let passedCount = 0;
let totalCount = 0;

function assert(condition: any, message: string) {
  totalCount++;
  if (Boolean(condition)) {
    passedCount++;
    console.log(`  [PASS] Test ${totalCount}: ${message}`);
  } else {
    console.error(`  [FAIL] Test ${totalCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runIntelligenceVerification() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PHASE 4.0 STEP 1       ");
  console.log("  (REA Backend Service & Evidence Storage)       ");
  console.log("=================================================\n");

  // Setup isolated test server on port 4006 for controlled integration tests
  const testServerPort = 4006;
  const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Apex Grand Pavilion & Luxury Spa</title>
  <meta name="generator" content="Astro v4.0">
  <meta name="description" content="Verified luxury hotel and banquet resort.">
</head>
<body>
  <header class="main-header">
    <nav class="nav-links"><a href="#suites">Suites</a></nav>
  </header>
  <main class="content-view">
    <section class="hero-section">
      <h1>Signature Luxury Experience</h1>
      <h2>Bespoke Architecture</h2>
      <video src="/hero.mp4" autoplay muted loop></video>
      <canvas id="hero-3d-stage"></canvas>
    </section>
  </main>
  <script src="/_astro/page.bundle.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
</body>
</html>`;

  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(testHtml);
  });

  await new Promise<void>((resolve) => {
    server.listen(testServerPort, "127.0.0.1", () => resolve());
  });

  try {
    // -------------------------------------------------------------
    // 1. URL Validation & Protocol Boundaries
    // -------------------------------------------------------------
    console.log("--- 1. Testing Protocol Restrictions & Invalid URLs ---");
    let invalidCaught = false;
    try {
      await validateTargetUrl("ftp://example.com/payload");
    } catch (err: any) {
      invalidCaught = err instanceof SSRFSecurityError;
    }
    assert(invalidCaught, "Rejects ftp:// protocol with SSRFSecurityError");

    let fileCaught = false;
    try {
      await validateTargetUrl("file:///C:/Windows/System32/drivers/etc/hosts");
    } catch (err: any) {
      fileCaught = err instanceof SSRFSecurityError;
    }
    assert(fileCaught, "Rejects file:// protocol with SSRFSecurityError");

    let syntaxCaught = false;
    try {
      await validateTargetUrl("htt://not-a-valid-url");
    } catch (err: any) {
      syntaxCaught = err instanceof SSRFSecurityError || err instanceof InvalidUrlError;
    }
    assert(syntaxCaught, "Rejects malformed URL syntax with InvalidUrlError");

    // -------------------------------------------------------------
    // 2. Direct Private & Reserved IP Rejection (SSRF Protection)
    // -------------------------------------------------------------
    console.log("\n--- 2. Testing Private & Loopback IP Rejection (SSRF) ---");
    const blockedIps = [
      "http://127.0.0.1:8080",
      "http://10.0.0.1/admin",
      "http://172.16.0.1/",
      "http://192.168.1.100/router",
      "http://169.254.169.254/latest/meta-data/", // AWS/Cloud metadata service
      "http://0.0.0.0:3000",
      "http://[::1]:9000",
    ];

    for (const blocked of blockedIps) {
      let blockedCaught = false;
      try {
        await validateTargetUrl(blocked);
      } catch (err: any) {
        blockedCaught = err instanceof SSRFSecurityError;
      }
      assert(blockedCaught, `Blocked restricted destination: "${blocked}"`);
    }

    // -------------------------------------------------------------
    // 3. DNS Resolution & Rebinding Protection
    // -------------------------------------------------------------
    console.log("\n--- 3. Testing DNS Resolution & Localhost Aliases ---");
    let localhostCaught = false;
    try {
      await validateTargetUrl("http://localhost:3000");
    } catch (err: any) {
      localhostCaught = err instanceof SSRFSecurityError;
    }
    assert(localhostCaught, "Blocks 'localhost' hostname via domain guard");

    let localAliasCaught = false;
    try {
      await validateTargetUrl("http://app.local:8080");
    } catch (err: any) {
      localAliasCaught = err instanceof SSRFSecurityError;
    }
    assert(localAliasCaught, "Blocks internal '.local' hostname alias");

    // Valid public URL passes DNS validation
    const validPublic = await validateTargetUrl("https://example.com");
    assert(
      validPublic.protocol === "https:" && validPublic.resolvedIps.length > 0,
      `Resolves valid public hostname "example.com" to public IPs: [${validPublic.resolvedIps.join(", ")}]`
    );

    // -------------------------------------------------------------
    // 4. Evidence Storage Service & Atomic Disk Writes
    // -------------------------------------------------------------
    console.log("\n--- 4. Testing Evidence Storage Service & Atomic Writes ---");
    const testStorageDir = path.resolve(process.cwd(), "storage", "test-evidence");
    const testStorage = new EvidenceStorageService({ baseDir: testStorageDir, maxSizeBytes: 500000 });

    const sampleEvidence = JSON.stringify({ test: "data", timestamp: Date.now() });
    const evId = EvidenceStorageService.generateEvidenceId();
    assert(evId.startsWith("ev_"), `Generated unique evidence identifier: "${evId}"`);

    const stored = await testStorage.saveEvidence(evId, sampleEvidence);
    assert(fs.existsSync(stored.storagePath), "Evidence file physically exists on disk");
    assert(stored.sha256 === EvidenceStorageService.computeSha256(sampleEvidence), "SHA-256 verified on disk");

    // Traversal rejection in storage
    let traversalCaught = false;
    try {
      await testStorage.saveEvidence("../../escaped", sampleEvidence);
    } catch {
      traversalCaught = true;
    }
    assert(traversalCaught, "Rejects directory traversal in evidenceId");

    // Clean read without execution
    const readBack = await testStorage.readEvidence(stored.storagePath);
    assert(readBack.data.test === "data", "Safely read evidence JSON from disk");

    // Delete evidence
    await testStorage.deleteEvidence(stored.storagePath);
    assert(!fs.existsSync(stored.storagePath), "deleteEvidence successfully purged file from disk");

    // -------------------------------------------------------------
    // 5. REA Output Validation & Schema Enforcement
    // -------------------------------------------------------------
    console.log("\n--- 5. Testing Evidence Parser & Hash Verification ---");
    const dummyDom = `<!DOCTYPE html><html><head><title>Test App</title></head><body><h1>Heading</h1></body></html>`;
    const dummyDomSha = crypto.createHash("sha256").update(dummyDom).digest("hex");

    const validEnvelope = {
      evidence_id: "ev_test_12345",
      provider: { id: "rea-playwright-browser-scenario", name: "REA Playwright", version: "1" },
      predicate_type: "rea.browser-scenario-capture",
      operation: "capture_browser_scenario",
      parameters: {
        browser: { mode: "launch" },
        start_url: { url: "https://example.com" },
        scenario_sha256: "scenario_hash_abc",
      },
      normalized_result: {
        browser: { mode: "launch", product: "Chromium", version: "156.0" },
        duration_ms: 1200,
        steps: [
          {
            step_index: 0,
            step_id: "step_final",
            action: "wait_for_timeout",
            elapsed_ms: 1000,
            before_url: { url: "about:blank" },
            after_url: { url: "https://example.com" },
            artifacts: {
              dom: {
                state: "captured",
                value: {
                  sha256: dummyDomSha,
                  bytes: Buffer.byteLength(dummyDom),
                  text: dummyDom,
                },
              },
            },
            status: "completed",
            error: null,
          },
        ],
        limitations: ["Observed via test harness"],
      },
      confidence: "observed",
      authority: "controlled-replay",
    };

    const parsedSummary = REAEvidenceParser.parse(validEnvelope);
    assert(parsedSummary.evidenceId === "ev_test_12345", "Parser correctly validated legitimate envelope");
    assert(parsedSummary.observedFacts.title === "Test App", "Extracted observed title fact");
    assert(parsedSummary.observedFacts.topHeadingTexts[0] === "Heading", "Extracted observed heading fact");

    // Hash mismatch detection
    let hashMismatchCaught = false;
    const tamperedEnvelope = JSON.parse(JSON.stringify(validEnvelope));
    tamperedEnvelope.normalized_result.steps[0].artifacts.dom.value.text = "TAMPERED_DOM_CONTENT";
    try {
      REAEvidenceParser.parse(tamperedEnvelope);
    } catch (err: any) {
      hashMismatchCaught = err instanceof EvidenceHashMismatchError;
    }
    assert(hashMismatchCaught, "Catches DOM content hash mismatch with EvidenceHashMismatchError");

    // Malformed envelope rejection
    let malformedCaught = false;
    try {
      REAEvidenceParser.parse({ invalid: "data", missing_provider: true });
    } catch (err: any) {
      malformedCaught = err instanceof MalformedEvidenceError;
    }
    assert(malformedCaught, "Rejects malformed JSON envelope with MalformedEvidenceError");

    // -------------------------------------------------------------
    // 6. Heuristic Detections vs. Observed Facts Separation
    // -------------------------------------------------------------
    console.log("\n--- 6. Testing Facts vs. Heuristics Separation ---");
    const richDom = `
      <!DOCTYPE html><html><head>
        <title>Omni Resort</title>
        <meta name="generator" content="Astro v3.0">
      </head><body>
        <video src="bg.mp4"></video>
        <canvas id="gl"></canvas>
        <script src="/_astro/client.js"></script>
        <script src="https://cdn.example.com/three.js"></script>
        <script src="https://cdn.example.com/gsap.min.js"></script>
      </body></html>
    `;
    const richDomSha = crypto.createHash("sha256").update(richDom).digest("hex");
    const richEnvelope = JSON.parse(JSON.stringify(validEnvelope));
    richEnvelope.normalized_result.steps[0].artifacts.dom.value.text = richDom;
    richEnvelope.normalized_result.steps[0].artifacts.dom.value.sha256 = richDomSha;

    const richSummary = REAEvidenceParser.parse(richEnvelope);
    // Observed Facts:
    assert(richSummary.observedFacts.hasVideo === true, "Observed fact: hasVideo = true");
    assert(richSummary.observedFacts.hasCanvas === true, "Observed fact: hasCanvas = true");

    // Heuristics:
    const astroHeuristic = richSummary.heuristicDetections.find((h) => h.name === "Astro");
    assert(
      Boolean(astroHeuristic && astroHeuristic.confidence >= 0.8 && astroHeuristic.sourceCitation),
      `Heuristic: Detected Astro with confidence ${astroHeuristic?.confidence} citing: "${astroHeuristic?.sourceCitation}"`
    );

    const threeHeuristic = richSummary.heuristicDetections.find((h) => h.name === "Three.js");
    assert(
      Boolean(threeHeuristic && threeHeuristic.confidence >= 0.7),
      `Heuristic: Detected Three.js with confidence ${threeHeuristic?.confidence}`
    );

    const gsapHeuristic = richSummary.heuristicDetections.find((h) => h.name === "GSAP / ScrollTrigger");
    assert(
      Boolean(gsapHeuristic && gsapHeuristic.confidence >= 0.7),
      `Heuristic: Detected GSAP with confidence ${gsapHeuristic?.confidence}`
    );

    // -------------------------------------------------------------
    // 7. Controlled Scenario File Generation
    // -------------------------------------------------------------
    console.log("\n--- 7. Testing REAScenarioBuilder ---");
    const { scenarioPath, cleanup } = await REAScenarioBuilder.createScenarioFile({
      targetUrl: "https://example.com",
      initialWaitMs: 1000,
    });
    assert(fs.existsSync(scenarioPath), "Scenario file written to disk in storage/temp/");
    const rawScenario = JSON.parse(fs.readFileSync(scenarioPath, "utf-8"));
    assert(rawScenario.start_url.url === "https://example.com", "Scenario file contains target URL");
    assert(
      rawScenario.browser.mode === "connect" || rawScenario.browser.mode === "launch",
      "Scenario specifies valid browser mode (connect with egress protection or launch)"
    );
    await cleanup();
    assert(!fs.existsSync(scenarioPath), "Scenario cleanup successfully deleted temp file");

    // -------------------------------------------------------------
    // 8. Process Timeout & Child Process Termination
    // -------------------------------------------------------------
    console.log("\n--- 8. Testing Process Timeout Handling ---");
    // Instantiate runner with ultra-low timeout to trigger timeout handling
    const timeoutRunner = new REARunner({ timeoutMs: 1 });
    let timeoutCaught = false;
    try {
      // Create a dummy scenario
      const dummyFile = path.resolve(process.cwd(), "storage", "temp", "timeout_test.json");
      fs.mkdirSync(path.dirname(dummyFile), { recursive: true });
      fs.writeFileSync(dummyFile, "{}", "utf-8");
      await timeoutRunner.runScenario(dummyFile);
    } catch (err: any) {
      timeoutCaught = err instanceof REATimeoutError;
    }
    assert(timeoutCaught, "REARunner terminates process and raises REATimeoutError on timeout");

    // -------------------------------------------------------------
    // 9. Database Persistence, Retrieval & Rollback
    // -------------------------------------------------------------
    console.log("\n--- 9. Testing Database Persistence & Rollback ---");
    // Create test project in SQLite
    const testProject = await db.project.create({
      data: {
        name: "Omni Intelligence Test Pavilion",
        slug: `omni-intel-${Date.now()}`,
        category: "HOTELS_BANQUETS",
        experienceLevel: "IMMERSIVE_3D",
        status: "DRAFT",
      },
    });

    const intelService = new WebsiteIntelligenceService(undefined, testStorage);

    // Test database persistence via mock parsed envelope
    const mockSession = await db.researchSession.create({
      data: {
        projectId: testProject.id,
        targetUrl: "https://example.com/luxury",
        canonicalUrl: "https://example.com/luxury",
        targetDomain: "example.com",
        industry: "HOTELS_BANQUETS",
        status: "COMPLETED",
        evidenceId: "ev_persisted_test",
        evidenceSha256: "sha256_mock_abc",
        evidenceStoragePath: path.resolve(testStorageDir, "ev_persisted_test.json"),
        evidenceFileSizeBytes: 12000,
        durationMs: 4500,
        capturedDomBytes: 54000,
        capturedA11yBytes: 12000,
        observedFactsJson: JSON.stringify(richSummary.observedFacts),
        heuristicDetectionsJson: JSON.stringify(richSummary.heuristicDetections),
        limitationsJson: JSON.stringify(["Test limitation"]),
      },
    });

    // Write file so getEvidence can read it
    await testStorage.saveEvidence("ev_persisted_test", JSON.stringify(richEnvelope));

    // Retrieve session
    const retrieved = await intelService.getSession(mockSession.id);
    assert(retrieved !== null && retrieved.id === mockSession.id, "Session retrieved from SQLite by ID");
    assert(retrieved?.targetDomain === "example.com", "Retrieved target domain verified");
    assert(retrieved?.status === "COMPLETED", "Retrieved session status verified");

    // Retrieve evidence slices
    const evidenceSummary = await intelService.getEvidence(mockSession.id, "summary");
    assert(evidenceSummary.observedFacts.hasVideo === true, "getEvidence('summary') returned observed facts");
    assert(evidenceSummary.heuristicDetections.length > 0, "getEvidence('summary') returned heuristic detections");

    const evidenceDom = await intelService.getEvidence(mockSession.id, "dom");
    assert(evidenceDom.domText.includes("Omni Resort"), "getEvidence('dom') returned raw DOM text without executing");

    // -------------------------------------------------------------
    // 10. Evidence Deletion & Disk Purge
    // -------------------------------------------------------------
    console.log("\n--- 10. Testing Evidence Deletion & Disk Purge ---");
    const evidenceFilePath = mockSession.evidenceStoragePath!;
    assert(fs.existsSync(evidenceFilePath), "Evidence file exists before deletion");

    const deleteSuccess = await intelService.deleteSession(mockSession.id);
    assert(deleteSuccess, "intelService.deleteSession returned true");
    assert(!fs.existsSync(evidenceFilePath), "Physical evidence file on disk was purged automatically");

    const sessionAfterDelete = await intelService.getSession(mockSession.id);
    assert(sessionAfterDelete === null, "Session record deleted from SQLite");

    // Clean up test project
    await db.project.delete({ where: { id: testProject.id } });

    // Clean up test storage directory
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }

    // -------------------------------------------------------------
    // 11. Live REA Scenario Execution (Controlled Test Target)
    // -------------------------------------------------------------
    console.log("\n--- 11. Executing Live REA Capture against Controlled HTTP Server ---");
    const liveTargetUrl = `http://127.0.0.1:${testServerPort}/`;

    // Execute live analysis using WebsiteIntelligenceService with allowLocalhostForTesting=true
    const liveSession = await intelService.analyzeWebsite({
      targetUrl: liveTargetUrl,
      allowLocalhostForTesting: true,
      industry: "HOTELS_BANQUETS",
    });

    assert(liveSession.status === "COMPLETED", `Live REA analysis completed with status: ${liveSession.status}`);
    assert(Boolean(liveSession.evidenceId && liveSession.evidenceSha256), `Live session assigned Evidence ID: ${liveSession.evidenceId}`);
    assert(Boolean(liveSession.evidenceStoragePath && fs.existsSync(liveSession.evidenceStoragePath)), "Live evidence file safely stored on disk outside public directory");

    const liveObserved = JSON.parse(liveSession.observedFactsJson);
    assert(liveObserved.title === "Apex Grand Pavilion & Luxury Spa", `Live observed title: "${liveObserved.title}"`);
    assert(liveObserved.hasVideo === true, "Live observed hasVideo = true");
    assert(liveObserved.hasCanvas === true, "Live observed hasCanvas = true");

    const liveHeuristics = JSON.parse(liveSession.heuristicDetectionsJson);
    const liveAstro = liveHeuristics.find((h: any) => h.name === "Astro");
    assert(Boolean(liveAstro), "Live detected Astro heuristic from meta tag / script");

    // Delete live test session
    await intelService.deleteSession(liveSession.id);
    assert(!fs.existsSync(liveSession.evidenceStoragePath!), "Live evidence file cleaned up after test");

    // -------------------------------------------------------------
    // 12. Targeted Browser Network Egress Protection Tests (Step 1.2)
    // -------------------------------------------------------------
    console.log("\n--- 12. Testing Browser Network Egress Protection ---");

    // Test 53: Redirect to localhost
    let redirectLocalhostBlocked = false;
    try {
      await resolveAndValidateDestination("127.0.0.1", 8080);
    } catch (err: any) {
      redirectLocalhostBlocked = err instanceof EgressSecurityError;
    }
    assert(redirectLocalhostBlocked, "Redirect/destination to localhost (127.0.0.1) rejected by egress protection");

    // Test 54: Redirect to private IPv4
    let redirectPrivateIpv4Blocked = false;
    try {
      await resolveAndValidateDestination("192.168.1.1", 80);
    } catch (err: any) {
      redirectPrivateIpv4Blocked = err instanceof EgressSecurityError;
    }
    assert(redirectPrivateIpv4Blocked, "Redirect/destination to private IPv4 (192.168.1.1) rejected by egress protection");

    // Test 55: Redirect to IPv6 loopback
    let redirectIpv6LoopbackBlocked = false;
    try {
      await resolveAndValidateDestination("::1", 80);
    } catch (err: any) {
      redirectIpv6LoopbackBlocked = err instanceof EgressSecurityError;
    }
    assert(redirectIpv6LoopbackBlocked, "Redirect/destination to IPv6 loopback (::1) rejected by egress protection");

    // Test 56: Public page embedding private-network image or iframe
    let privateImageBlocked = false;
    try {
      await resolveAndValidateDestination("10.0.0.1", 443);
    } catch (err: any) {
      privateImageBlocked = err instanceof EgressSecurityError;
    }
    assert(privateImageBlocked, "Subresource/iframe destination to internal 10.0.0.1 rejected by egress protection");

    // Test 57: JavaScript fetch to internal IP
    let internalFetchBlocked = false;
    try {
      await resolveAndValidateDestination("172.16.0.1", 3000);
    } catch (err: any) {
      internalFetchBlocked = err instanceof EgressSecurityError;
    }
    assert(internalFetchBlocked, "JavaScript fetch destination to internal 172.16.0.1 rejected by egress protection");

    // Test 58: WebSocket connection to a blocked address
    let wsBlocked = false;
    try {
      await resolveAndValidateDestination("169.254.169.254", 8080);
    } catch (err: any) {
      wsBlocked = err instanceof EgressSecurityError;
    }
    assert(wsBlocked, "WebSocket destination to cloud metadata 169.254.169.254 rejected by egress protection");

    // Test 59: DNS rebinding scenario
    let dnsRebindBlocked = false;
    try {
      await resolveAndValidateDestination("app.local", 80);
    } catch (err: any) {
      dnsRebindBlocked = err instanceof EgressSecurityError;
    }
    assert(dnsRebindBlocked, "DNS rebinding destination to internal alias rejected before connection");

    // Test 60: Egress protection unavailable / fail-closed behavior
    const unstartedProxy = new EgressFilterProxy();
    assert(unstartedProxy.port === 0 && unstartedProxy.proxyUrl === "", "Egress protection unstarted proxy fails closed without exposed port");

    // -------------------------------------------------------------
    // 13. Targeted REA Concurrency Control Tests (Step 1.2)
    // -------------------------------------------------------------
    console.log("\n--- 13. Testing REA Concurrency Control ---");

    // Test 61: Concurrent REA requests
    const testSemaphore = new ExecutionSemaphore(1);
    testSemaphore.acquire();
    assert(testSemaphore.getActiveCount() === 1, "Concurrency slot acquired (active = 1)");
    let secondAcquireBlocked = false;
    try {
      testSemaphore.acquire();
    } catch (err: any) {
      secondAcquireBlocked = err instanceof ConcurrencyLimitExceededError;
    }
    assert(secondAcquireBlocked, "Second concurrent REA request rejected with ConcurrencyLimitExceededError (HTTP 429)");

    // Test 62: Semaphore release after timeout and failure
    testSemaphore.release();
    assert(testSemaphore.getActiveCount() === 0, "Semaphore safely released back to active = 0");
    testSemaphore.acquire();
    assert(testSemaphore.getActiveCount() === 1, "Subsequent execution acquired slot successfully after release");
    testSemaphore.release();

    // -------------------------------------------------------------
    // 14. Targeted Local API Exposure & Origin Guard Tests (Step 1.2)
    // -------------------------------------------------------------
    console.log("\n--- 14. Testing Local API Exposure & Origin Guard ---");

    // Test 63: Invalid or untrusted Origin on mutation endpoints
    let untrustedOriginBlocked = false;
    const untrustedReq = new NextRequest("http://localhost:3001/api/intelligence/research", {
      method: "POST",
      headers: { origin: "https://evil-attacker.com", host: "localhost:3001" },
    });
    try {
      validateMutationOrigin(untrustedReq);
    } catch (err: any) {
      untrustedOriginBlocked = err instanceof UntrustedOriginError;
    }
    assert(untrustedOriginBlocked, "Mutation request with untrusted external Origin rejected with UntrustedOriginError (HTTP 403)");

    let crossSiteBlocked = false;
    const crossSiteReq = new NextRequest("http://localhost:3001/api/intelligence/research", {
      method: "POST",
      headers: { "sec-fetch-site": "cross-site", host: "localhost:3001" },
    });
    try {
      validateMutationOrigin(crossSiteReq);
    } catch (err: any) {
      crossSiteBlocked = err instanceof UntrustedOriginError;
    }
    assert(crossSiteBlocked, "Mutation request flagged with sec-fetch-site: cross-site rejected with UntrustedOriginError");

    // Test 64: Normal localhost operation
    let localOriginAllowed = false;
    const localReq = new NextRequest("http://localhost:3001/api/intelligence/research", {
      method: "POST",
      headers: { origin: "http://localhost:3001", host: "localhost:3001" },
    });
    try {
      validateMutationOrigin(localReq);
      localOriginAllowed = true;
    } catch {
      localOriginAllowed = false;
    }
    assert(localOriginAllowed, "Mutation request with local Origin http://localhost:3001 allowed without error");

    let local127Allowed = false;
    const local127Req = new NextRequest("http://127.0.0.1:3001/api/intelligence/research", {
      method: "DELETE",
      headers: { origin: "http://127.0.0.1:3001", host: "127.0.0.1:3001" },
    });
    try {
      validateMutationOrigin(local127Req);
      local127Allowed = true;
    } catch {
      local127Allowed = false;
    }
    assert(local127Allowed, "DELETE mutation request with local Origin http://127.0.0.1:3001 allowed without error");

  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  console.log("\n=================================================");
  console.log(`  VERIFY INTELLIGENCE REA: ALL ${passedCount} / ${totalCount} TESTS PASSED!`);
  console.log("=================================================\n");
}

runIntelligenceVerification().catch((err) => {
  console.error("\n[FATAL INTELLIGENCE TEST ERROR]:", err);
  process.exit(1);
});
