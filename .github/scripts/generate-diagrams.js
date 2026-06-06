const fs = require('fs');
const path = require('path');

function generateArchitectureDiagram(metadata, graph) {
    let diagram = '```mermaid\n';
    diagram += 'graph TD\n';

    // Group nodes by directories to create subgraphs
    const directories = {};
    graph.nodes.forEach(node => {
        if (node.type === 'module') {
            const dir = path.dirname(node.id).split('/')[0] || 'root';
            if (!directories[dir]) directories[dir] = [];
            directories[dir].push(node);
        }
    });

    // Add Frameworks
    diagram += '  subgraph Frameworks\n';
    metadata.frameworks.forEach(f => {
        const cleanId = f.replace(/[^a-zA-Z0-9]/g, '_');
        diagram += `    ${cleanId}["${f}"]\n`;
    });
    diagram += '  end\n';

    // Add architecture components based on directory structure
    Object.keys(directories).forEach(dir => {
        const cleanDirId = dir.replace(/[^a-zA-Z0-9]/g, '_');
        diagram += `  subgraph ${cleanDirId}\n`;
        directories[dir].forEach(node => {
            const cleanId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
            const cleanLabel = node.label.replace(/[^a-zA-Z0-9.\-]/g, '_');
            // Interactive clickable nodes linking to the source file
            diagram += `    ${cleanId}["${cleanLabel}"]\n`;
            diagram += `    click ${cleanId} href "https://github.com/owner/repo/blob/main/${node.id}" "View Source"\n`;
        });
        diagram += '  end\n';
    });

    // Generate some basic edges from the knowledge graph
    let edgeCount = 0;
    const maxEdges = 40;

    for (const edge of graph.edges) {
        if (edge.type === 'imports' && edgeCount < maxEdges) {
            const sourceId = edge.source.replace(/[^a-zA-Z0-9]/g, '_');
            const targetId = edge.target.replace(/[^a-zA-Z0-9]/g, '_');
            diagram += `  ${sourceId} --> ${targetId}\n`;
            edgeCount++;
        }
    }

    diagram += '```\n';
    return diagram;
}

function generateDependencyDiagram(graph) {
    let diagram = '```mermaid\n';
    diagram += 'graph TD\n';

    graph.nodes.forEach((node) => {
        const cleanId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanLabel = node.label.replace(/[^a-zA-Z0-9.\-]/g, '_');
        diagram += `  ${cleanId}["${cleanLabel}"]\n`;

        if (node.type === 'external_dependency') {
            diagram += `  style ${cleanId} fill:#f9f,stroke:#333,stroke-width:2px\n`;
        } else {
            // Interactive clickable nodes for internal modules
            diagram += `  click ${cleanId} href "https://github.com/owner/repo/blob/main/${node.id}" "View Source"\n`;
        }
    });

    let edgeCount = 0;
    const maxEdges = 50;

    for (const edge of graph.edges) {
        if (edgeCount++ > maxEdges) {
            diagram += `  %% Truncated for performance\n`;
            break;
        }
        const sourceId = edge.source.replace(/[^a-zA-Z0-9]/g, '_');
        const targetId = edge.target.replace(/[^a-zA-Z0-9]/g, '_');
        // Thicker lines for external dependencies vs internal imports
        if (edge.type === 'depends_on') {
            diagram += `  ${sourceId} ==> ${targetId}\n`;
        } else {
            diagram += `  ${sourceId} --> ${targetId}\n`;
        }
    }

    diagram += '```\n';
    return diagram;
}

function main() {
    console.log("Generating dynamic diagrams...");

    fs.mkdirSync('diagrams', { recursive: true });

    let metadata = { frameworks: [] };
    if (fs.existsSync('.github/repo-metadata.json')) {
        metadata = JSON.parse(fs.readFileSync('.github/repo-metadata.json', 'utf8'));
    }

    let graph = { nodes: [], edges: [] };
    if (fs.existsSync('.github/knowledge-graph.json')) {
        graph = JSON.parse(fs.readFileSync('.github/knowledge-graph.json', 'utf8'));
    }

    const archDiagram = generateArchitectureDiagram(metadata, graph);
    fs.writeFileSync('diagrams/architecture.md', archDiagram);

    const depDiagram = generateDependencyDiagram(graph);
    fs.writeFileSync('diagrams/dependencies.md', depDiagram);

    console.log("Diagrams generated in 'diagrams/' directory");
}

main();
