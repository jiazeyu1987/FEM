const fs = require('fs');
const content = fs.readFileSync('D:/ProjectPackage/FEM/frontend/script.js', 'utf8');
const lines = content.split('\n');

try {
  // Check syntax by parsing the JavaScript
  new Function(content);
  console.log('✅ JavaScript syntax: OK');

  // Verify key functions are removed
  if (content.includes('renderEventsTable')) {
    console.log('❌ renderEventsTable function still found');
  } else {
    console.log('✅ renderEventsTable function removed');
  }

  if (content.includes('eventsTable')) {
    console.log('❌ eventsTable references still found');
  } else {
    console.log('✅ eventsTable references removed');
  }

  if (content.includes('events-pane')) {
    console.log('❌ events-pane references still found');
  } else {
    console.log('✅ events-pane references removed');
  }

  // Check for correct default values
  if (content.includes('roiDimensions = {w: 100, h: 200}')) {
    console.log('✅ roiDimensions default height updated to 200');
  } else {
    console.log('❌ roiDimensions default height not updated correctly');
  }

  if (content.includes('|| 200') && content.includes('roiHeightInput.value')) {
    console.log('✅ height fallback value updated to 200');
  } else {
    console.log('❌ height fallback value not updated correctly');
  }

} catch (e) {
  console.log('❌ JavaScript syntax error:', e.message);
  console.log('Lines around error:');
  const lineNum = parseInt(e.message.match(/:(\d+):/)?.[1] || '0');
  const start = Math.max(0, lineNum - 5);
  const end = Math.min(lines.length, lineNum + 5);
  for (let i = start; i < end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

// Print lines around the problematic area
for (let i = 185; i < Math.min(200, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}