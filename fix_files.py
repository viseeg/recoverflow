import os
import re

def fix_file(filepath):
    print(f"Fixing file: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Find body: "..." where the string inside contains newlines
    # and replace the double quotes with backticks
    def replacer(match):
        string_val = match.group(1)
        # Convert literal double quotes to backticks
        return f"body: `{string_val}`"

    # Regex matches body: "..." where the content inside the quotes spans multiple lines
    new_content = re.sub(r'body:\s*"(.*?)"', replacer, content, flags=re.DOTALL)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)

if __name__ == "__main__":
    workspace_dir = r"C:\Users\guerr\.gemini\antigravity\scratch\recoverflow"
    
    # First, fix Dashboard.jsx
    dashboard_path = os.path.join(workspace_dir, "src", "components", "Dashboard.jsx")
    fix_file(dashboard_path)
    
    # Second, fix index.html
    index_path = os.path.join(workspace_dir, "index.html")
    fix_file(index_path)
    
    print("Files successfully formatted!")
