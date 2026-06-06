const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findFiles(dir, pattern, excludeList = ['node_modules', '.git', 'dist', 'build', 'artifacts']) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (excludeList.includes(file)) return;

        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            results = results.concat(findFiles(filePath, pattern, excludeList));
        } else if (file.match(pattern)) {
            results.push(filePath);
        }
    });
    return results;
}

function detectFrameworks() {
    const frameworks = [];

    // Check package.json
    if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        if (deps['react']) frameworks.push('React');
        if (deps['next']) frameworks.push('Next.js');
        if (deps['vue']) frameworks.push('Vue');
        if (deps['express']) frameworks.push('Express');
        if (deps['typescript']) frameworks.push('TypeScript');
        if (deps['jest']) frameworks.push('Jest');
        if (deps['@playwright/test']) frameworks.push('Playwright');
    }

    // Check python
    if (fs.existsSync('requirements.txt')) {
        const reqs = fs.readFileSync('requirements.txt', 'utf8');
        if (reqs.includes('Django')) frameworks.push('Django');
        if (reqs.includes('Flask')) frameworks.push('Flask');
        if (reqs.includes('FastAPI')) frameworks.push('FastAPI');
    }

    return frameworks;
}

function getRepoStats() {
    try {
        const tsFiles = findFiles('.', /\.tsx?$/);
        const jsFiles = findFiles('.', /\.jsx?$/);
        const pyFiles = findFiles('.', /\.py$/);
        const mdFiles = findFiles('.', /\.md$/);

        return {
            fileCounts: {
                typescript: tsFiles.length,
                javascript: jsFiles.length,
                python: pyFiles.length,
                markdown: mdFiles.length,
                totalAnalyzed: tsFiles.length + jsFiles.length + pyFiles.length + mdFiles.length
            }
        };
    } catch (e) {
        console.error("Error calculating stats:", e);
        return { fileCounts: {} };
    }
}

function detectInfrastructure() {
    const infra = [];
    if (fs.existsSync('Dockerfile')) infra.push('Docker');
    if (fs.existsSync('docker-compose.yml')) infra.push('Docker Compose');
    if (findFiles('.', /terraform\.tfstate$/).length > 0 || findFiles('.', /\.tf$/).length > 0) infra.push('Terraform');
    if (fs.existsSync('serverless.yml')) infra.push('Serverless Framework');
    return infra;
}

function detectEnvVars() {
    const envVars = new Set();
    const tsFiles = findFiles('.', /\.(ts|js|tsx|jsx)$/);

    tsFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        // Look for process.env.SOMETHING
        const matches = content.match(/process\.env\.([A-Z0-9_]+)/g);
        if (matches) {
            matches.forEach(m => envVars.add(m.replace('process.env.', '')));
        }
    });

    return Array.from(envVars);
}

function main() {
    console.log("Starting repository analysis...");

    const analysis = {
        lastUpdated: new Date().toISOString(),
        frameworks: detectFrameworks(),
        infrastructure: detectInfrastructure(),
        stats: getRepoStats(),
        envVariables: detectEnvVars()
    };

    fs.writeFileSync('.github/repo-metadata.json', JSON.stringify(analysis, null, 2));
    console.log("Analysis complete. Saved to .github/repo-metadata.json");
}

main();
