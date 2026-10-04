"""Package only this homework's source, assets, docs and tests; never credentials/dependencies."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
root_files = [
    "README.md", "require.md", "package.json", "package-lock.json", "index.html",
    "tsconfig.json", "vite.config.ts", "vitest.config.ts", "playwright.config.ts",
    ".gitignore", ".env.example",
]
files = [root / name for name in root_files]
for directory in ["src", "public", "docs", "tests", "scripts"]:
    files.extend(p for p in (root / directory).rglob("*") if p.is_file()
                 and p.name != ".DS_Store" and "__pycache__" not in p.parts)
archive = root / "hw1-draft.zip"
with ZipFile(archive, "w", ZIP_DEFLATED) as bundle:
    for path in sorted(files):
        bundle.write(path, Path("hw1") / path.relative_to(root))
size = archive.stat().st_size
if size >= 100_000_000:
    raise RuntimeError("The package exceeds the 100 MB homework limit.")
print(f"{archive.name}: {size / 1_000_000:.2f} MB, {len(files)} files")
