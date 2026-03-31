"""
Gera o site estático em out/ a partir dos templates Jinja2 em src/templates/.
"""
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape


ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
TEMPLATES = SRC / "templates"
STATIC = SRC / "static"
OUT = ROOT / "out"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    env = Environment(
        loader=FileSystemLoader(TEMPLATES),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template("index.html.jinja2")
    html = template.render()
    (OUT / "index.html").write_text(html, encoding="utf-8")

    out_static = OUT / "static"
    out_static.mkdir(parents=True, exist_ok=True)
    for path in STATIC.glob("*"):
        if path.is_file():
            (out_static / path.name).write_bytes(path.read_bytes())

    print(f"Build OK: {OUT / 'index.html'}")


if __name__ == "__main__":
    main()
