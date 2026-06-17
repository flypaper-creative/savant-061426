# Asteroid Model Directory

Place your 3D loader model here as:
`public/assets/ast/ast.glb`

You can upload this file or drag-and-drop the `public/assets/ast` directory directly into the **AI Studio File Explorer** sidebar on the left side of the screen.

### Technical Note on Model Usage
The current simulation is implemented using a high-performance **2D Canvas** context. If you want to load and render this `ast.glb` 3D model:
1. We can install **Three.js** (`three`) and set up a WebGL space renderer.
2. Alternatively, we can render traditional 3D projection paths into the existing 2D Canvas space, or let me know if you would like me to rewrite the canvas helper to use WebGL/Three.js!
