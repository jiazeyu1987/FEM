const fs = require('fs');
const content = fs.readFileSync('D:/ProjectPackage/Puray/HEM/frontend/script.js', 'utf8');
const lines = content.split('\n');

// Print lines around the problematic area
for (let i = 185; i < Math.min(200, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}