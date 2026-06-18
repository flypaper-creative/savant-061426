const fs = require('fs');
let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

const anchorRegex = /vy: \(-ast\.y \* 0\.004\) \+ \(Math\.random\(\) - 0\.5\) \* 3\.0,/;

const fullRegex = /vx: \(-ast\.x \* 0\.004\) \+ \(Math\.random\(\) - 0\.5\) \* 3\.0, \/\/ Imperfect leading\n\s*vy: \(-ast\.y \* 0\.004\) \+ \(Math\.random\(\) - 0\.5\) \* 3\.0,/;

const replacement = `vx: (-ast.x * 0.006) + (isHeavy ? (v - 1) * 3.5 : 0), // Pre-calculated structured fan attack pattern
                   vy: (-ast.y * 0.006) + (isHeavy ? Math.sin(timeNow * 0.005 + v) * 2.0 : 0),`;

if (content.match(fullRegex)) {
  content = content.replace(fullRegex, replacement);
  fs.writeFileSync('src/components/AsteroidCanvas.tsx', content);
  console.log('Drone firing updated to structured fan');
} else {
  console.log('Regex fail drone firing');
}
