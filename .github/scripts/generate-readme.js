const fs = require('fs');
const path = require('path');

function generateReadme() {
    let metadata = { frameworks: [], envVariables: [], stats: { fileCounts: {} } };
    if (fs.existsSync('.github/repo-metadata.json')) {
        metadata = JSON.parse(fs.readFileSync('.github/repo-metadata.json', 'utf8'));
    }

    let archDiagram = '';
    if (fs.existsSync('diagrams/architecture.md')) {
        archDiagram = fs.readFileSync('diagrams/architecture.md', 'utf8');
    }

    let depDiagram = '';
    if (fs.existsSync('diagrams/dependencies.md')) {
        depDiagram = fs.readFileSync('diagrams/dependencies.md', 'utf8');
    }

    const projectName = path.basename(process.cwd()) || 'Repository';

    let readme = `# ${projectName}\n\n`;

    readme += `![CI/CD](https://img.shields.io/github/actions/workflow/status/owner/repo/ci.yml?branch=main) `;
    readme += `![Analysis](https://img.shields.io/github/actions/workflow/status/owner/repo/repository-analysis.yml) \n\n`;

    readme += `> **Note**: This documentation is completely auto-generated and maintained by the Repository Automation System.\n\n`;

    readme += `## 🚀 Overview\n\n`;
    readme += `This repository is an automated, self-documenting system that continuously analyzes its own structure and updates its documentation.\n\n`;

    readme += `## 🛠️ Technology Stack\n\n`;
    if (metadata.frameworks.length > 0) {
        readme += metadata.frameworks.map(f => `- ${f}`).join('\n') + '\n\n';
    } else {
        readme += `No specific frameworks detected yet.\n\n`;
    }

    readme += `## 🏗️ Architecture\n\n`;
    readme += `### System Diagram\n\n`;
    readme += archDiagram + '\n\n';

    readme += `### Component Dependencies\n\n`;
    readme += depDiagram + '\n\n';

    readme += `## 📁 Repository Structure & Stats\n\n`;
    readme += `- **TypeScript Files**: ${metadata.stats.fileCounts.typescript || 0}\n`;
    readme += `- **JavaScript Files**: ${metadata.stats.fileCounts.javascript || 0}\n`;
    readme += `- **Python Files**: ${metadata.stats.fileCounts.python || 0}\n`;
    readme += `- **Total Analyzed Files**: ${metadata.stats.fileCounts.totalAnalyzed || 0}\n\n`;

    readme += `## ⚙️ Environment Variables\n\n`;
    if (metadata.envVariables.length > 0) {
        readme += `The following environment variables are detected in the codebase:\n\n`;
        readme += metadata.envVariables.map(v => `- \`${v}\``).join('\n') + '\n\n';
    } else {
        readme += `No environment variables detected in code.\n\n`;
    }

    readme += `## 📖 Setup Instructions\n\n`;
    readme += `1. Clone the repository\n`;
    readme += `2. Run \`pnpm install\` or \`npm install\`\n`;
    readme += `3. Configure the environment variables listed above\n`;
    readme += `4. Run \`pnpm run build\` and \`pnpm run test\`\n\n`;

    readme += `## 🤖 AI Documentation Agent\n\n`;
    readme += `This repository uses an AI documentation agent that reviews pull requests, detects architectural changes, and keeps this documentation up to date automatically.\n\n`;

    readme += `---\n`;
    readme += `*Last updated: ${new Date().toISOString()}*\n`;

    fs.writeFileSync('README.md', readme);
    console.log("README.md has been automatically generated and updated.");
}

generateReadme();
