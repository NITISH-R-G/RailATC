const fs = require('fs');
const path = require('path');

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

function parseImports(content) {
    const imports = [];

    // ES6 imports
    const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    // CommonJS requires
    const requireRegex = /require\(['"](.*?)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    return imports;
}

function analyzeDependencies() {
    let pkgDeps = {};
    if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkgDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    }
    return Object.keys(pkgDeps);
}

function buildGraph() {
    console.log("Building knowledge graph...");
    const files = findFiles('.', /\.(ts|tsx|js|jsx)$/);

    const nodes = [];
    const edges = [];

    const externalDeps = analyzeDependencies();
    externalDeps.forEach(dep => {
        nodes.push({ id: dep, type: 'external_dependency', label: dep });
    });

    files.forEach(file => {
        const relativePath = path.relative('.', file);
        nodes.push({ id: relativePath, type: 'module', label: path.basename(file) });

        const content = fs.readFileSync(file, 'utf8');
        const imports = parseImports(content);

        imports.forEach(imp => {
            if (imp.startsWith('.')) {
                // Internal dependency (simplified resolution)
                const targetPath = path.join(path.dirname(relativePath), imp);
                edges.push({ source: relativePath, target: targetPath, type: 'imports' });
            } else {
                // External dependency
                // We map it to the top-level package name
                const pkgName = imp.startsWith('@') ? imp.split('/').slice(0, 2).join('/') : imp.split('/')[0];
                edges.push({ source: relativePath, target: pkgName, type: 'depends_on' });
            }
        });
    });

    const graph = {
        nodes,
        edges,
        metadata: {
            generatedAt: new Date().toISOString(),
            nodeCount: nodes.length,
            edgeCount: edges.length
        }
    };

    fs.writeFileSync('.github/knowledge-graph.json', JSON.stringify(graph, null, 2));
    console.log("Knowledge graph built and saved to .github/knowledge-graph.json");
}

buildGraph();
