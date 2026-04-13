"""
Gera o site estático em out/ a partir dos templates Jinja2 em src/templates/.
"""
import os
import re
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape


ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
TEMPLATES = SRC / "templates"
STATIC = SRC / "static"
OUT = ROOT / "out"

# Fallback se não houver env (ex.: build local): alinhar ao slug desejado na Vercel
_DEFAULT_SITE = "https://itajunior.vercel.app"


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


_GTM_ID_RE = re.compile(r"^GTM-[A-Z0-9]+$", re.IGNORECASE)
_GA4_ID_RE = re.compile(r"^G-[A-Z0-9]+$", re.IGNORECASE)


def resolve_gtm_container_id() -> str:
    """ID do Google Tag Manager (ex.: GTM-XXXXXX). Defina GTM_CONTAINER_ID no build (ex.: Vercel)."""
    raw = (os.environ.get("GTM_CONTAINER_ID") or os.environ.get("PUBLIC_GTM_ID") or "").strip()
    if not raw:
        return ""
    raw = raw.upper()
    return raw if _GTM_ID_RE.match(raw) else ""


def resolve_ga4_measurement_id() -> str:
    """Measurement ID do GA4 (ex.: G-XXXXXXXX). GA4_MEASUREMENT_ID no build (ex.: Vercel)."""
    raw = (os.environ.get("GA4_MEASUREMENT_ID") or os.environ.get("GOOGLE_MEASUREMENT_ID") or "").strip()
    if not raw:
        return ""
    raw = raw.upper()
    return raw if _GA4_ID_RE.match(raw) else ""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    env = Environment(
        loader=FileSystemLoader(TEMPLATES),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template("index.html.jinja2")
    site_url = resolve_site_url()
    gtm_id = resolve_gtm_container_id()
    ga4_id = resolve_ga4_measurement_id()
    html = template.render(site_url=site_url, gtm_id=gtm_id, ga4_id=ga4_id)
    (OUT / "index.html").write_text(html, encoding="utf-8")

    out_static = OUT / "static"
    out_static.mkdir(parents=True, exist_ok=True)
    for path in STATIC.rglob("*"):
        if path.is_file():
            rel = path.relative_to(STATIC)
            dest = out_static / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(path.read_bytes())

    print(f"Build OK: {OUT / 'index.html'}")


if __name__ == "__main__":
    main()
