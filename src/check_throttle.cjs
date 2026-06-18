const fs = require('fs');

let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

// We will replace setScore, setStats, setAsteroidsBlasted inside the fast loop with references,
// then sync them in a setInterval or at the end of the tick but only if they changed significantly, or just throttle them.

if (!content.includes('const scoreRef = useRef(0);')) {
  console.log("We need to add scoreRef and statsRef.");
}
