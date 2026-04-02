"""
Gera o site estático em out/ a partir dos templates Jinja2 em src/templates/.
"""
import os
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape


ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
TEMPLATES = SRC / "templates"
STATIC = SRC / "static"
OUT = ROOT / "out"

# Fallback se não houver env (ex.: build local): alinhar ao slug desejado na Vercel
_DEFAULT_SITE = "https://itajunior-mapeamentodeprocessos.vercel.app"


def resolve_site_url() -> str:
    """URL base https sem barra final — para canonical, og:url e og:image."""
    # Deploy de preview: usar o hostname deste deploy (evita canonical apontando para produção)
    if os.environ.get("VERCEL_ENV") == "preview":
        vercel_preview = (os.environ.get("VERCEL_URL") or "").strip().rstrip("/")
        if vercel_preview:
            return "https://" + vercel_preview.lstrip("/")
    explicit = (os.environ.get("PUBLIC_SITE_URL") or "").strip().rstrip("/")
    if explicit:
        if not explicit.startswith("http"):
            explicit = "https://" + explicit.lstrip("/")
        return explicit
    prod = (os.environ.get("VERCEL_PROJECT_PRODUCTION_URL") or "").strip().rstrip("/")
    if prod:
        if not prod.startswith("http"):
            prod = "https://" + prod.lstrip("/")
        return prod
    vercel = (os.environ.get("VERCEL_URL") or "").strip().rstrip("/")
    if vercel:
        return "https://" + vercel.lstrip("/")
    return _DEFAULT_SITE


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    env = Environment(
        loader=FileSystemLoader(TEMPLATES),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template("index.html.jinja2")
    site_url = resolve_site_url()
    html = template.render(site_url=site_url)
    (OUT / "index.html").write_text(html, encoding="utf-8")

    out_static = OUT / "static"
    out_static.mkdir(parents=True, exist_ok=True)
    for path in STATIC.glob("*"):
        if path.is_file():
            (out_static / path.name).write_bytes(path.read_bytes())

    print(f"Build OK: {OUT / 'index.html'}")


if __name__ == "__main__":
    main()
