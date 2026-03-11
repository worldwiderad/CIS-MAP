class PathfindingEngine {
    constructor(mapData) {
        this.nodes = {}; // Map of id -> node object
        this.adjacencyList = {}; // Map of id -> [{ neighborId, cost }]

        this._parseMapData(mapData);
    }

    _parseMapData(mapData) {
        if (!mapData || !mapData.nodes || !mapData.edges) {
            console.error("Invalid map data provided to PathfindingEngine.");
            return;
        }

        // Parse nodes
        mapData.nodes.forEach(node => {
            this.nodes[node.id] = { id: node.id, x: node.x, y: node.y };
            this.adjacencyList[node.id] = [];
        });

        // Parse edges (assuming bidirectional)
        mapData.edges.forEach(edge => {
            const n1 = edge.node1;
            const n2 = edge.node2;
            const distance = edge.distance;

            if (this.nodes[n1] && this.nodes[n2]) {
                this.adjacencyList[n1].push({ neighborId: n2, cost: distance });
                this.adjacencyList[n2].push({ neighborId: n1, cost: distance }); // Bidirectional
            } else {
                console.warn(`Edge connects unknown node(s): ${n1} <-> ${n2}`);
            }
        });
    }

    // Heuristic: Straight-line distance between two nodes
    _heuristic(nodeAId, nodeBId) {
        const nodeA = this.nodes[nodeAId];
        const nodeB = this.nodes[nodeBId];
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    findShortestPath(startId, destId) {
        if (!this.nodes[startId] || !this.nodes[destId]) {
            console.error("Start or destination node not found in graph.");
            return null;
        }

        // Open set: Array of nodes to be evaluated, sorted by fScore (lowest first)
        // We'll just use a simple array and sort it, which is fine for small/medium graphs.
        const openSet = [startId];

        // For node n, cameFrom[n] is the node immediately preceding it on the cheapest path from start
        const cameFrom = {};

        // For node n, gScore[n] is the cost of the cheapest path from start to n currently known.
        const gScore = {};
        for (const id in this.nodes) gScore[id] = Infinity;
        gScore[startId] = 0;

        // For node n, fScore[n] = gScore[n] + h(n).
        const fScore = {};
        for (const id in this.nodes) fScore[id] = Infinity;
        fScore[startId] = this._heuristic(startId, destId);

        while (openSet.length > 0) {
            // Find node in openSet with lowest fScore
            // Sort in descending order, then pop the last element (lowest value) for O(1) removal
            openSet.sort((a, b) => fScore[b] - fScore[a]);
            const currentId = openSet.pop();

            if (currentId === destId) {
                return this._reconstructPath(cameFrom, currentId);
            }

            const neighbors = this.adjacencyList[currentId];
            for (const neighborInfo of neighbors) {
                const neighborId = neighborInfo.neighborId;
                const weight = neighborInfo.cost;

                // tentative_gScore is the distance from start to the neighbor through current
                const tentativeGScore = gScore[currentId] + weight;

                if (tentativeGScore < gScore[neighborId]) {
                    // This path to neighbor is better than any previous one. Record it!
                    cameFrom[neighborId] = currentId;
                    gScore[neighborId] = tentativeGScore;
                    fScore[neighborId] = gScore[neighborId] + this._heuristic(neighborId, destId);

                    if (!openSet.includes(neighborId)) {
                        openSet.push(neighborId);
                    }
                }
            }
        }

        // Open set is empty but goal was never reached
        console.warn("No path found between", startId, "and", destId);
        return null;
    }

    _reconstructPath(cameFrom, currentId) {
        const totalPathIds = [currentId];
        while (cameFrom[currentId]) {
            currentId = cameFrom[currentId];
            totalPathIds.unshift(currentId); // prepend
        }

        // Convert path of IDs back to array of coordinate objects
        return totalPathIds.map(id => ({
            id: id,
            x: this.nodes[id].x,
            y: this.nodes[id].y
        }));
    }
}

// Make globally available
window.PathfindingEngine = PathfindingEngine;
