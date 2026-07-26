import shutil
import re

src = r"C:\Users\LENOVO\.gemini\antigravity\scratch\manajemen-wali-kelas\appscript_backend\app_logic.html"
dst = r"C:\Users\LENOVO\.gemini\antigravity\scratch\manajemen-wali-kelas\html-vanilla\app_logic.js"

# Read source
with open(src, 'r', encoding='utf-8') as f:
    content = f.read()

# Old ending to replace
old_ending = """        window.onerror = function(msg, url, line, col, error) {
            document.body.innerHTML = '<div style="color:red; padding:20px; font-family:sans-serif;"><h3>Global JS Error</h3><p>' + msg + '</p><p>Line: ' + line + '</p><pre>' + (error ? error.stack : '') + '</pre></div>';
            return false;
        };

        try {
            bootApp();
        } catch (e) {
            document.body.innerHTML = '<div style="color:red; padding:20px; font-family:sans-serif;"><h3>BootApp Error</h3><pre>' + e.stack + '</pre></div>';
        }"""

new_ending = """        window.onerror = function(msg, url, line, col, error) {
            console.error('Global JS Error:', msg, 'Line:', line, error ? error.stack : '');
            return false;
        };

        // bootApp dipanggil dari login handler atau DOMContentLoaded jika sudah login
        try {
            if (window.currentUser) {
                bootApp();
            }
        } catch (e) {
            console.error('BootApp Error:', e.stack);
        }"""

if old_ending in content:
    content = content.replace(old_ending, new_ending)
    print("Replacement successful!")
else:
    print("ERROR: Old ending not found in source file!")
    # Try to debug
    print("Last 500 chars of file:")
    print(repr(content[-500:]))

# Write to destination
with open(dst, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"File written to: {dst}")
print(f"Total characters: {len(content)}")
