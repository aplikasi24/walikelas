const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split('\n');
lines.forEach((line, i) => {
    if (line.includes('confirm(')) console.log(`CONFIRM ${i+1}: ${line.trim()}`);
    if (line.includes('prompt(')) console.log(`PROMPT ${i+1}: ${line.trim()}`);
    if (line.includes('alert(')) console.log(`ALERT ${i+1}: ${line.trim()}`);
});
