# AGENTS.md

## Project Overview
This repository contains a mobile-first, client-side web application designed to help English Language Learner (ELL) students navigate Level 4 of the Canadian International School (CIS). 

The application overlays an HTML5 `<canvas>` onto a static floor plan image. It uses an A* pathfinding algorithm to calculate the shortest route between two rooms and visually draws the path.

## Tech Stack & Architecture
* **Frontend:** Vanilla HTML5, CSS3, and JavaScript (ES6+). No frontend frameworks (like React or Vue) are used in order to keep the app lightweight and ensure it loads instantly when triggered via QR codes.
* **Pathfinding:** A* (A-star) algorithm implemented in pure JavaScript.
* **Data Structure:** Navigation graph (nodes, edges, pixel distances) and localized UI strings are stored in standard JSON.
* **Hosting:** GitHub Pages (Static site).

## File Structure Conventions
* `index.html`: The main UI structure.
* `css/style.css`: Mobile-responsive styling.
* `js/app.js`: Main application logic, UI event listeners, and `<canvas>` drawing execution.
* `js/pathfinding.js`: Isolated logic for the A* routing algorithm.
* `data/map_data.json`: The exported node and edge graph data.
* `data/i18n.json`: Dictionary for UI text translation.

## Coding Style & Design Guidelines
1. **Bilingual UI:** The interface must prioritize English and Simplified Chinese equally. Design components to either display both languages simultaneously (e.g., "Library / 图书馆") or provide a prominent toggle. Data structures must be built to easily support Hindi and Korean in future iterations.
2. **Mobile Optimization:** This app will be accessed by students walking the halls with their smartphones. All CSS must be mobile-first (portrait orientation). Interactive elements (dropdowns, buttons) must be large, touch-friendly, and universally recognizable without relying heavily on text.
3. **Canvas Rendering:** The drawn path must be high-contrast, brightly colored, and thick enough to be easily readable on a small screen. 
4. **Vanilla JS:** Stick to standard DOM manipulation and modern JS features. Do not add npm dependencies, package managers, or complex build steps for the main application.

## Development Workflow
* **Helper Tools:** Any temporary HTML/JS tools used by the developer to plot X/Y coordinates on the map image should be kept in a separate `/tools` directory so they do not bloat the production app.
* **Running Locally:** Because this is a static site without a backend, you can serve it locally using simple HTTP servers (e.g., `npx serve .` or a basic Python server).
