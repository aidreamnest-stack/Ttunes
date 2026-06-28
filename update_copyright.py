import os

files = [
    r"terms/index.html",
    r"submission/index.html",
    r"privacy/index.html",
    r"index.html",
    r"dmca/index.html",
    r"contact/index.html",
    r"about/index.html",
    r"cookies/index.html"
]

target = "2025 TribleTunes"
replacement = "2026 TribleTunes"

# Dynamically set base directory to the directory of this script
base_dir = os.path.dirname(os.path.abspath(__file__))

for file_path in files:
    # Support both backslash and slash for cross-platform safety
    normalized_path = file_path.replace("\\", "/").replace("/", os.sep)
    full_path = os.path.join(base_dir, normalized_path)
    try:
        if not os.path.exists(full_path):
            print(f"File not found: {full_path}")
            continue
            
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if target in content:
            new_content = content.replace(target, replacement)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {file_path}")
        else:
            print(f"Target not found in {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
