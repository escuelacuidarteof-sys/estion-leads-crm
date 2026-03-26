
path = r'c:\Users\jmart\Documents\Escuela Cuid-Arte\Gestion de leads\components\Layout.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    line_idx = 313 # 0-indexed for 314
    line = lines[line_idx]
    print(f"Line {line_idx+1}: '{line}'")
    print(f"Length: {len(line)}")
    print(f"Leading whitespace: {len(line) - len(line.lstrip())}")
    print(f"Representation: {repr(line)}")
