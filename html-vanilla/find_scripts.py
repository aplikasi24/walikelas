import sys

path = r"C:\Users\LENOVO\.gemini\antigravity\scratch\manajemen-wali-kelas\html-vanilla\index.html"
try:
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            line_lower = line.lower()
            if '<script' in line_lower:
                print(f"{i+1}: {line.strip()}")
            elif 'let defaultdata' in line_lower or 'const defaultdata' in line_lower or 'var defaultdata' in line_lower:
                print(f"{i+1}: {line.strip()}")
            elif 'function dologin' in line_lower or 'const dologin' in line_lower:
                print(f"{i+1}: {line.strip()}")
            elif 'function renderdashboard' in line_lower:
                print(f"{i+1}: {line.strip()}")
            elif 'bootapp()' in line_lower:
                print(f"{i+1}: {line.strip()}")
except Exception as e:
    print(e)
