from PIL import Image, ImageDraw
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "public"

for output_size in (192, 512):
    scale = 4
    size = output_size * scale
    ratio = size / 512
    image = Image.new("RGB", (size, size), "#07111c")
    draw = ImageDraw.Draw(image)
    def box(values): return tuple(int(value * ratio) for value in values)
    def line(points, fill, width): draw.line([(int(x * ratio), int(y * ratio)) for x, y in points], fill=fill, width=int(width * ratio), joint="curve")

    draw.rounded_rectangle(box((34, 34, 478, 478)), radius=int(96 * ratio), fill="#20c98b")
    dark = "#032219"
    line([(84,308),(428,308)], dark, 30)
    line([(112,308),(112,362),(400,362),(400,308)], dark, 30)
    for x in (144,198,310,364): line([(x,362),(x,436)], dark, 30)
    line([(126,246),(55,194),(137,194)], dark, 27)
    line([(362,308),(362,142)], dark, 38)
    draw.rectangle(box((128,214,234,308)), fill=dark)
    draw.rectangle(box((158,171,207,222)), fill=dark)
    line([(84,458),(110,447),(136,466),(162,458),(188,447),(214,466),(240,458),(266,447),(292,466),(318,458),(344,447),(370,466),(396,458)], "#09583f", 25)
    line([(362,47),(362,143)], "#f8fdfb", 38)
    line([(314,95),(410,95)], "#f8fdfb", 38)
    image.resize((output_size, output_size), Image.Resampling.LANCZOS).save(root / f"app-icon-platform-{output_size}.png", optimize=True)
