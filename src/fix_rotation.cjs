const fs = require('fs');

let logoc = fs.readFileSync('src/components/LogoCanvas.tsx', 'utf8');
const logoRotReg = /child\.geometry\.rotateX\(Math\.PI\);\n/;
if(logoc.match(logoRotReg)) {
   logoc = logoc.replace(logoRotReg, '');
} else if (logoc.match(/child\.geometry\.rotateZ\(Math\.PI\);\n/)) {
   logoc = logoc.replace(/child\.geometry\.rotateZ\(Math\.PI\);\n/, '');
}
// Maybe we need rotateZ(Math.PI)? Usually the user said "it is upside down again. Please turn it over vertically... The single loop should be on top and the two loops should be on the bottom".
// If rotateZ(PI) was upside down, and rotateX(PI) was upside down. That means maybe we need to just rotateZ(Math.PI) or just remove it or rotateZ(Math.PI) + rotateX(Math.PI).
fs.writeFileSync('src/components/LogoCanvas.tsx', logoc);

let astc = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');
if(astc.match(logoRotReg)) {
   astc = astc.replace(logoRotReg, '');
}
fs.writeFileSync('src/components/AsteroidCanvas.tsx', astc);
