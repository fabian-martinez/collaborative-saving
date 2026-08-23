#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI Escape Codes for Premium UI Styling
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

console.log(`${CYAN}${BOLD}=== 🤖 Google Antigravity Code Review Agent ===${RESET}\n`);

// 1. Load environment variables from root .env manually to avoid dependencies
function loadEnv() {
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (parts) {
        const key = parts[1];
        let val = parts[2] || '';
        // Remove surrounding quotes if any
        if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
          val = val.substring(1, val.length - 1);
        } else if (val.length > 0 && val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
  }
}

loadEnv();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log(`${YELLOW}${BOLD}⚠️ WARNING:${RESET} GEMINI_API_KEY environment variable is not defined.`);
  console.log(`${YELLOW}The automated AI code review will be skipped so as not to block your work.${RESET}`);
  console.log(`To enable AI reviews, obtain a Gemini API key and add it to your root .env file:`);
  console.log(`${BOLD}  GEMINI_API_KEY=your_api_key_here${RESET}\n`);
  process.exit(0);
}

// 2. Fetch Git Diff and Branch Details
function getBranchName() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    return 'unknown-branch';
  }
}

const isPreCommit = process.argv.includes('--pre-commit');

function getGitDiff() {
  try {
    if (isPreCommit) {
      return execSync('git diff --cached', { encoding: 'utf8' }).trim();
    }
    // 1. Try to get diff between origin/main and HEAD
    return execSync('git diff origin/main...HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    try {
      // 2. Fallback to main...HEAD
      return execSync('git diff main...HEAD', { encoding: 'utf8' }).trim();
    } catch (e2) {
      try {
        // 3. Fallback to last commit if main is not accessible
        return execSync('git diff HEAD~1', { encoding: 'utf8' }).trim();
      } catch (e3) {
        return '';
      }
    }
  }
}

const branchName = getBranchName();
const diffContent = getGitDiff();

// Skip if there are no changes on the branch or staged
if (!diffContent) {
  const skipMsg = isPreCommit 
    ? 'No staged changes detected. Skipping AI review.'
    : 'No changes detected compared to main. Skipping AI review.';
  console.log(`${GREEN}✅ ${skipMsg}${RESET}\n`);
  process.exit(0);
}

// Check if trying to commit/push directly to main
if (branchName === 'main' || branchName === 'master') {
  console.log(`${RED}${BOLD}❌ VIOLATION DETECTED:${RESET} Committing/Pushing directly to 'main' branch is prohibited.`);
  console.log(`${RED}Please follow CONTRIBUTING.md, create a feature branch, and open a PR.${RESET}\n`);
  process.exit(1);
}

console.log(`${BLUE}Analyzing changes on branch: ${BOLD}${branchName}${RESET}...`);

// 3. System rules/instructions from AGENTS.md
const systemInstructions = `
You are an expert senior code reviewer for the Collaborative Saving project.
You must review the provided Git Diff against the following strict project rules from AGENTS.md:

1. WORKFLOW (Git):
   - Never commit or push directly to the 'main' branch. (Already validated, but keep it in mind).
   - Ensure the code follows clean contributing practices.

2. STRICT HEXAGONAL ARCHITECTURE:
   - The domain layer must NEVER depend on the infrastructure (infra) layer or application layer.
   - Domain files (e.g., in domain/entities, domain/ports) must be pure TypeScript and should not import NestJS modules, TypeORM entities directly, controllers, etc.

3. DOUBLE-ENTRY BOOKKEEPING (Contabilidad de Partida Doble):
   - Any financial or ledger transaction must register entries in 'ledger_entries' ensuring that the total balance of the operation's entries is exactly zero (assets/debits equal liabilities/credits).
   - Confirm that financial transactions use the accounting build system rather than manual database edits.

4. API NAMING CONVENTION:
   - Endpoints, payloads, and API requests/responses must use 'snake_case' (not camelCase) to maintain database consistency.

5. NESTJS INJECTION OF DEPENDENCIES (DI):
   - Do NOT create local tokens with Symbol('...') inside NestJS modules.
   - All transversal and repository tokens MUST be centralized in 'backend/src/domain/constants/injection-tokens.ts' to avoid UnknownDependenciesException.

Your response must be JSON matching this exact schema:
{
  "approved": boolean, // Set to false if there is any violation of the rules above or a major bug. Set to true if everything is perfectly fine.
  "explanation": string, // A short professional review summary.
  "issues": string[] // A list of specific issues or architectural violations found. Empty if approved.
}
`;

const promptContent = `
Evaluate the following Git Diff of branch '${branchName}' for compliance with the project rules.

--- START OF GIT DIFF ---
${diffContent}
--- END OF GIT DIFF ---
`;

// 4. Invoke Gemini API or Mock
async function performAiReview() {
  try {
    let reviewData;

    if (process.env.MOCK_REVIEW === 'true') {
      const mockApproved = process.env.MOCK_APPROVED === 'true';
      reviewData = {
        approved: mockApproved,
        explanation: mockApproved
          ? "Mock Review: The changes follow strict Hexagonal Architecture and double-entry bookkeeping rules. Standard imports are clean and correct."
          : "Mock Review: Found architectural violations in NestJS dependency injection and module design.",
        issues: mockApproved
          ? []
          : [
              "NESTJS DI VIOLATION: Local Symbol('...') token defined inside a local module instead of 'backend/src/domain/constants/injection-tokens.ts'.",
              "HEXAGONAL ARCHITECTURE VIOLATION: Domain entity is importing TypeORM repository or infrastructure classes."
            ]
      };
    } else {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstructions}\n\n${promptContent}` }]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  approved: { type: 'BOOLEAN' },
                  explanation: { type: 'STRING' },
                  issues: {
                    type: 'ARRAY',
                    items: { type: 'STRING' }
                  }
                },
                required: ['approved', 'explanation', 'issues']
              }
            }
          })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
      }

      const resJson = await response.json();
      
      if (!resJson.candidates || resJson.candidates.length === 0) {
        throw new Error('No candidates returned from Gemini API.');
      }

      const replyText = resJson.candidates[0].content.parts[0].text;
      reviewData = JSON.parse(replyText);
    }

    // 5. Append to Local History File (.agent/reviews/review-history.md)
    logReviewToHistory(reviewData);

    // If running as pre-commit and approved, stage the history file so it is included in the commit
    if (isPreCommit && reviewData.approved) {
      try {
        const historyFile = path.join(__dirname, '../reviews/review-history.md');
        execSync(`git add "${historyFile}"`);
        console.log(`${GREEN}✅ Staged review history for this commit.${RESET}`);
      } catch (addError) {
        console.error(`${RED}⚠️ Failed to stage review-history.md:${RESET}`, addError.message);
      }
    }

    // 6. Output beautiful styled report
    printReviewResult(reviewData);

    if (reviewData.approved) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error(`${RED}${BOLD}❌ ERROR running AI Review Agent:${RESET}`, error.message);
    console.log(`${YELLOW}AI Review failed due to external error. Proceeding with push so as not to block workflow.${RESET}\n`);
    process.exit(0); // Gracefully proceed on system error
  }
}

function logReviewToHistory(review) {
  const reviewsDir = path.join(__dirname, '../reviews');
  if (!fs.existsSync(reviewsDir)) {
    fs.mkdirSync(reviewsDir, { recursive: true });
  }

  const historyFile = path.join(reviewsDir, 'review-history.md');
  const now = new Date();
  
  let header = '';
  if (!fs.existsSync(historyFile)) {
    header = `# Code Review History 📈\n\nThis file tracks all automated AI code reviews performed prior to Git pushes.\n\n`;
  }

  const logEntry = `
## Review Session: ${now.toLocaleString()} (${now.getTimezoneOffset() === 300 ? 'Colombia' : 'UTC'})
- **Branch:** \`${branchName}\`
- **Verdict:** ${review.approved ? '✅ **APPROVED**' : '❌ **REJECTED**'}

### Explanation
${review.explanation}

${review.issues && review.issues.length > 0 
  ? `### Issues / Suggested Improvements\n${review.issues.map(i => `- ${i}`).join('\n')}`
  : `### Issues / Suggested Improvements\n- *No architectural violations or issues found. Excellent work!*`
}

---
`;

  fs.appendFileSync(historyFile, header + logEntry, 'utf8');
}

function printReviewResult(review) {
  console.log(`\n${CYAN}================== REVIEW RESULTS ==================${RESET}`);
  if (review.approved) {
    console.log(`${GREEN}${BOLD}💚 VERDICT: APPROVED${RESET}`);
    console.log(`${GREEN}Your changes comply perfectly with all project and architecture rules.${RESET}\n`);
    console.log(`${BOLD}Explanation:${RESET}`);
    console.log(`  ${review.explanation}`);
  } else {
    console.log(`${RED}${BOLD}🔴 VERDICT: REJECTED${RESET}`);
    console.log(`${RED}Your changes contain architectural violations or potential issues.${RESET}\n`);
    console.log(`${BOLD}Explanation:${RESET}`);
    console.log(`  ${review.explanation}`);
    console.log(`\n${RED}${BOLD}Issues to Resolve:${RESET}`);
    review.issues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. ⚠️ ${issue}`);
    });
    console.log(`\n${YELLOW}Please resolve these violations or update your files before pushing.${RESET}`);
    console.log(`${YELLOW}You can find a complete record in .agent/reviews/review-history.md.${RESET}`);
  }
  console.log(`${CYAN}====================================================${RESET}\n`);
}

performAiReview();
