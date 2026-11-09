# CIS-MAP (first prototype)

The first version of an indoor navigation app for Level 4 of the Canadian International School, from March 2026. It has been replaced by **[CIS-MAP-V2](https://github.com/worldwiderad/CIS-MAP-V2)**, which covers the whole campus.

Live: [worldwiderad.github.io/CIS-MAP](https://worldwiderad.github.io/CIS-MAP/)

## What's here

- **`tools/mapper.html`**: a floor-plan digitiser. Load a floor plan onto the canvas, Shift+Click to place nodes (rooms, stairs, junctions) and Alt+Click to join them with edges, then export the graph as JSON.
- **`index.html`, `js/app.js`**: the phone app. Pick a start and a destination from searchable lists and it draws the route on the floor plan, with pan and pinch-zoom.
- **`js/pathfinding.js`**: A* over the node graph in `data/map_data.json`.
- **`data/i18n.json`**: English and Simplified Chinese strings for the language toggle.

Plain HTML, CSS and JavaScript with no build step. Serve the folder (`python3 -m http.server`) and open `index.html`.
