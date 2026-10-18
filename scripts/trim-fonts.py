"""
The public site's Bengali fonts, served from public/fonts (src/styles/fonts.css).

- Anek Bangla: Google Fonts' Bengali file (variable, weights 100 to 800), cut to the weights the site uses (400 to
  800) and without glyph names: about 156 KB down to 138 KB. Its characters stay whole: Studio text can use any of them.
- Tiro Bangla (quotations): one file with the Bengali block and the spaces, punctuation and quote marks a quotation
  uses, instead of Google's Bengali file plus a 20 KB Latin one fetched only for them.

Both are under the SIL Open Font License, with no Reserved Font Name, so trimming them is allowed; their licences sit
beside the files (public/fonts/OFL-*.txt).

Run: python3 scripts/trim-fonts.py   (needs fonttools and brotli: pip install fonttools brotli)
Then bump FONT_VERSION here and the file names in src/styles/fonts.css and src/lib/fonts.ts (ANEK_BANGLA_URL),
since the files are cached for a year.
"""

import io
import re
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONT_VERSION = "v1"
OUT = Path(__file__).resolve().parent.parent / "public" / "fonts"
# A modern browser, so Google answers with woff2 files split by script.
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


TIRO_TTF = "https://github.com/google/fonts/raw/main/ofl/tirobangla/TiroBangla-Regular.ttf"
# The Bengali block (as Google's Bengali file has it), the spaces and punctuation of a quotation, and dashes, quote marks
# and the ellipsis (U+2010 to U+2027). Latin letters are left to Anek Latin.
TIRO_UNICODES = [
    *map(ord, " !\"'(),-.:;?"), 0x00A0, 0x0951, 0x0952, 0x0964, 0x0965, *range(0x0980, 0x09FF),
    0x1CD0, 0x1CD2, 0x1CD5, 0x1CD6, 0x1CD8, 0x1CE1, 0x1CEA, 0x1CED, 0x1CF2, 0x1CF5, 0x1CF6, 0x1CF7,
    0x200C, 0x200D, *range(0x2010, 0x2028), 0x20B9, 0x25CC, 0xA8F1,
]


def bengali_file(css_url: str) -> bytes:
    """The woff2 file of the Bengali block from a Google Fonts stylesheet."""
    css = urllib.request.urlopen(urllib.request.Request(css_url, headers={"User-Agent": UA})).read().decode()
    for face in css.split("@font-face")[1:]:
        if "U+0980-09FE" in face:
            url = re.search(r"url\((https://[^)]+\.woff2)\)", face).group(1)
            return urllib.request.urlopen(url).read()
    raise SystemExit(f"No Bengali file in {css_url}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    anek = TTFont(io.BytesIO(bengali_file("https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@100..800&display=swap")))
    anek = instancer.instantiateVariableFont(anek, {"wght": (400, 800)})
    anek["post"].formatType = 3.0
    anek.flavor = "woff2"
    anek.save(OUT / f"anek-bangla-{FONT_VERSION}.woff2")

    tiro = TTFont(io.BytesIO(urllib.request.urlopen(TIRO_TTF).read()))
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.hinting = False  # as Google serves it
    options.glyph_names = False
    options.flavor = "woff2"
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=TIRO_UNICODES)
    subsetter.subset(tiro)
    tiro.flavor = "woff2"
    tiro.save(OUT / f"tiro-bangla-{FONT_VERSION}.woff2")

    for f in sorted(OUT.glob("*.woff2")):
        print(f"{f.name}: {f.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
