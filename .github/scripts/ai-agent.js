// Advanced AI Agent script for CI documentation/architecture review
const fs = require('fs');

async function getPRDiff() {
    const prNumber = process.env.PR_NUMBER;
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPOSITORY || 'owner/repo'; // Default if running locally

    if (!token || !prNumber) {
        console.warn("Missing GITHUB_TOKEN or PR_NUMBER. Simulating review with mock diff.");
        return `
+ function initDatabase() {
+    // Connecting to PostgreSQL
+ }
+ function createNewMicroservice() {
+    // Something architectural
+ }
        `;
    }

    console.log(`Fetching diff for PR #${prNumber} from GitHub API...`);
    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3.diff'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`);
        }

        return await response.text();
    } catch (e) {
        console.error("Failed to fetch PR diff", e);
        return "";
    }
}

async function analyzeWithAI(diff) {
    console.log("Analyzing diff with AI (checking for architectural changes)...");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.warn("OPENAI_API_KEY is not set. Falling back to heuristic analysis.");
        return heuristicAnalysis(diff);
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert AI documentation agent. Analyze the following pull request diff. Determine if it introduces architectural changes (e.g., new databases, external dependencies, new microservices, API changes). Respond ONLY in valid JSON format with three keys: 'hasArchChanges' (boolean), 'summary' (string explaining the changes concisely), and 'docsNeeded' (string detailing what documentation or diagrams must be updated, or null if none)."
                    },
                    {
                        role: "user",
                        content: `PR Diff:\n${diff.substring(0, 8000)}` // truncate to avoid token limits
                    }
                ],
                temperature: 0.1
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API returned ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        try {
            const parsed = JSON.parse(content);
            return {
                hasArchChanges: !!parsed.hasArchChanges,
                summary: parsed.summary || "Unable to generate summary.",
                docsNeeded: parsed.docsNeeded || null
            };
        } catch (parseError) {
             console.error("Failed to parse OpenAI JSON response", content);
             return heuristicAnalysis(diff);
        }

    } catch (e) {
        console.error("Error calling OpenAI API:", e);
        return heuristicAnalysis(diff);
    }
}

function heuristicAnalysis(diff) {
    const archKeywords = ['database', 'import ', 'require(', 'docker', 'kubernetes', 'api', 'route', 'microservice', 'config', 'schema'];
    let hasArchChanges = false;
    let matchCount = 0;

    for (const keyword of archKeywords) {
        if (diff.toLowerCase().includes(keyword)) {
            matchCount++;
        }
    }

    if (matchCount > 1) {
        hasArchChanges = true;
        return {
            hasArchChanges: true,
            summary: "This PR appears to introduce architectural modifications, potentially altering routing, schemas, or dependencies based on keyword analysis.",
            docsNeeded: "Please review and ensure that the interactive architecture diagrams and knowledge graph are automatically updated upon merge. Ensure the API/schema documentation reflects these changes."
        };
    }

    return {
        hasArchChanges: false,
        summary: "Routine changes with no significant architectural impact detected.",
        docsNeeded: null
    };
}

async function postComment(analysis) {
    const prNumber = process.env.PR_NUMBER;
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPOSITORY || 'owner/repo';

    const commentBody = `**AI Documentation Review:**\n\n${analysis.summary}\n\n${analysis.docsNeeded ? '**Action Required:** ' + analysis.docsNeeded : ''}`;

    if (!token || !prNumber) {
        console.log("Mock: Posting comment to GitHub PR...");
        console.log(`\n--- COMMENT ---\n${commentBody}\n---------------\n`);
        return;
    }

    try {
        await fetch(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ body: commentBody })
        });
        console.log("Successfully posted AI review comment to PR.");
    } catch (e) {
         console.error("Failed to post comment to GitHub", e);
    }
}

async function main() {
    console.log("Starting AI Documentation Agent...");
    const diff = await getPRDiff();
    const analysis = await analyzeWithAI(diff);
    await postComment(analysis);
    console.log("AI Agent run complete.");
}

main();
