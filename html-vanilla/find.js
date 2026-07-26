const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// List of all functions that might contain confirm/prompt
// We can use a regex to find all `onclick="func()"` or standard event handlers
// Or we can just find 'confirm(' and 'prompt(' and manually fix them in index.html

let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('confirm(')) console.log(`L${i+1}: ${lines[i].trim()}`);
    if (lines[i].includes('prompt(')) console.log(`L${i+1}: ${lines[i].trim()}`);
    if (lines[i].includes('alert(')) console.log(`L${i+1}: ${lines[i].trim()}`);
}
