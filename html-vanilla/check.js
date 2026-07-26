const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
    try {
        const { Script } = require('vm');
        new Script(scriptMatch[1]); // This just compiles the code without running it
        console.log("Syntax OK");
    } catch (e) {
        console.error("Syntax Error:", e);
    }
} else {
    console.log("No script block found.");
}
