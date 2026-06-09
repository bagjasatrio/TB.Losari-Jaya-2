from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "diagram_revisi"
OUT.mkdir(exist_ok=True)

FONT_REGULAR = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")
INK = "#172033"
LINE = "#40516f"
HEADER = "#dbe7f6"
LIGHT = "#f7f9fc"
ACCENT = "#eaf1fa"
DECISION = "#fff1bf"


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size)


def text_box(draw, xy, text, size=24, bold=False, fill=INK, anchor="mm"):
    draw.multiline_text(
        xy,
        "\n".join(wrap(text, width=max(12, int(38 * 24 / size)))),
        font=font(size, bold),
        fill=fill,
        anchor=anchor,
        align="center",
        spacing=5,
    )


def line(draw, points, width=4, fill=LINE):
    draw.line(points, fill=fill, width=width, joint="curve")


def arrow(draw, start, end, width=4, fill=LINE):
    line(draw, [start, end], width, fill)
    x1, y1 = start
    x2, y2 = end
    dx, dy = x2 - x1, y2 - y1
    length = max((dx * dx + dy * dy) ** 0.5, 1)
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    tip = (x2, y2)
    left = (x2 - ux * 22 + px * 10, y2 - uy * 22 + py * 10)
    right = (x2 - ux * 22 - px * 10, y2 - uy * 22 - py * 10)
    draw.polygon([tip, left, right], fill=fill)


def rounded(draw, box, text, size=22, fill=LIGHT, outline=LINE, radius=16):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=3)
    text_box(draw, ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), text, size)


def ellipse(draw, box, text, size=20, fill=LIGHT):
    draw.ellipse(box, fill=fill, outline=LINE, width=3)
    text_box(draw, ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), text, size)


def title(draw, text, width):
    draw.rectangle((0, 0, width, 85), fill=HEADER)
    text_box(draw, (width / 2, 43), text, 31, True)


def save(image, name):
    image.save(OUT / name, dpi=(220, 220), optimize=True)


def actor(draw, x, y, label):
    draw.ellipse((x - 22, y - 85, x + 22, y - 41), outline=INK, width=4)
    line(draw, [(x, y - 41), (x, y + 35)], 4, INK)
    line(draw, [(x - 48, y - 12), (x + 48, y - 12)], 4, INK)
    line(draw, [(x, y + 35), (x - 42, y + 90)], 4, INK)
    line(draw, [(x, y + 35), (x + 42, y + 90)], 4, INK)
    text_box(draw, (x, y + 125), label, 25, True)


def use_case():
    w, h = 2200, 1500
    im = Image.new("RGB", (w, h), "white")
    d = ImageDraw.Draw(im)
    title(d, "Use Case Diagram Sistem POS TB. Losari Jaya 2", w)
    d.rounded_rectangle((310, 120, 1890, 1430), radius=20, outline=LINE, width=4, fill="#ffffff")
    text_box(d, (1100, 158), "Sistem POS dan Persediaan", 25, True)
    actor(d, 150, 690, "Admin")
    actor(d, 2050, 690, "Kasir")

    admin_cases = [
        ("Kelola Data Barang", 390, 255),
        ("Kelola Master Data", 390, 430),
        ("Catat Barang Masuk", 390, 605),
        ("Kelola Pengguna", 390, 780),
        ("Kelola Pelanggan & Hutang", 390, 955),
        ("Void, Retur & Stok Opname", 390, 1130),
        ("Lihat Laporan & Keuangan", 390, 1305),
    ]
    shared_cases = [
        ("Login", 900, 250),
        ("Lihat Dashboard", 900, 455),
        ("Lihat Detail Transaksi", 900, 660),
        ("Cetak Ulang Struk", 900, 865),
        ("Ubah Password", 900, 1070),
        ("Logout", 900, 1275),
    ]
    cashier_cases = [
        ("Transaksi Penjualan", 1430, 390),
        ("Pilih Barang & Jumlah", 1430, 600),
        ("Pilih Pelanggan / Kredit", 1430, 810),
        ("Terima Pembayaran Tunai / QRIS", 1430, 1020),
        ("Cetak Struk", 1430, 1230),
    ]
    for text, x, y in admin_cases + shared_cases + cashier_cases:
        ellipse(d, (x, y - 65, x + 390, y + 65), text)

    for _, x, y in admin_cases:
        line(d, [(198, 680), (x, y)], 3)
    for _, x, y in shared_cases:
        line(d, [(198, 680), (x, y)], 3)
        line(d, [(2002, 680), (x + 390, y)], 3)
    for _, x, y in cashier_cases:
        line(d, [(2002, 680), (x + 390, y)], 3)

    arrow(d, (1625, 455), (1290, 455), 3)
    text_box(d, (1455, 425), "<<include>>", 17)
    arrow(d, (1625, 600), (1625, 455), 3)
    arrow(d, (1625, 810), (1625, 455), 3)
    arrow(d, (1625, 1020), (1625, 455), 3)
    arrow(d, (1625, 1230), (1290, 865), 3)
    save(im, "usecase_pos.png")


def activity_diagram(name, diagram_title, lanes, steps, decisions=None):
    w, h = 2100, 1400
    im = Image.new("RGB", (w, h), "white")
    d = ImageDraw.Draw(im)
    title(d, diagram_title, w)
    left, top, right, bottom = 90, 120, w - 90, h - 70
    lane_w = (right - left) / len(lanes)
    d.rectangle((left, top, right, bottom), outline=LINE, width=4)
    for i, lane_name in enumerate(lanes):
        x1 = left + lane_w * i
        x2 = x1 + lane_w
        d.rectangle((x1, top, x2, top + 70), fill=HEADER, outline=LINE, width=3)
        text_box(d, ((x1 + x2) / 2, top + 35), lane_name, 23, True)
        if i:
            line(d, [(x1, top), (x1, bottom)], 3)

    centers = {}
    for key, lane_idx, y, text in steps:
        cx = left + lane_w * lane_idx + lane_w / 2
        box = (cx - lane_w * 0.36, y - 48, cx + lane_w * 0.36, y + 48)
        rounded(d, box, text, 20, ACCENT if lane_idx == 1 else LIGHT)
        centers[key] = (cx, y, box)
    if decisions:
        for key, lane_idx, y, text in decisions:
            cx = left + lane_w * lane_idx + lane_w / 2
            points = [(cx, y - 62), (cx + 92, y), (cx, y + 62), (cx - 92, y)]
            d.polygon(points, fill=DECISION, outline=LINE)
            text_box(d, (cx, y), text, 19, True)
            centers[key] = (cx, y, (cx - 92, y - 62, cx + 92, y + 62))

    ordered = [key for key, *_ in steps]
    if decisions:
        ordered += [key for key, *_ in decisions]
    order_map = {key: idx for idx, key in enumerate(ordered)}
    links = sorted(
        [(a, b, label) for a, b, label in activity_links[name]],
        key=lambda link: order_map.get(link[0], 0),
    )
    for a, b, label in links:
        ax, ay, ab = centers[a]
        bx, by, bb = centers[b]
        if abs(ax - bx) < 10:
            start = (ax, ab[3])
            end = (bx, bb[1])
        else:
            start = (ab[2] if bx > ax else ab[0], ay)
            end = (bb[0] if bx > ax else bb[2], by)
        arrow(d, start, end, 3)
        if label:
            text_box(d, ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2 - 20), label, 17)
    save(im, name)


activity_links = {
    "activity_login.png": [
        ("open", "form", ""), ("form", "submit", ""), ("submit", "check", ""),
        ("check", "dashboard", "Valid"), ("check", "error", "Tidak valid"), ("error", "submit", ""),
        ("dashboard", "end", ""),
    ],
    "activity_dashboard.png": [
        ("login", "request", ""), ("request", "query", ""), ("query", "state", ""),
        ("state", "render", ""), ("render", "choose", ""), ("choose", "refresh", "Muat ulang"),
        ("refresh", "query", ""), ("choose", "menu", "Pilih menu"),
    ],
    "activity_admin.png": [
        ("dash", "select", ""), ("select", "process", ""), ("process", "validate", ""),
        ("validate", "save", "Valid"), ("validate", "error", "Tidak valid"),
        ("error", "select", ""), ("save", "state", ""), ("state", "dash", ""),
    ],
    "activity_cashier.png": [
        ("dash", "find", ""), ("find", "cart", ""), ("cart", "stock", ""),
        ("stock", "cart", "Kurang"), ("stock", "pay", "Cukup"), ("pay", "validate", ""),
        ("validate", "sale", "Valid"), ("validate", "pay", "Tidak valid"),
        ("sale", "reduce", ""), ("reduce", "receipt", ""),
    ],
    "activity_user_management.png": [
        ("menu", "list", ""), ("list", "action", ""), ("action", "form", "Tambah/Ubah"),
        ("form", "validate", ""), ("validate", "save", "Valid"), ("validate", "form", "Tidak valid"),
        ("action", "delete", "Hapus"), ("delete", "save", ""), ("save", "list", ""),
    ],
}


def activities():
    activity_diagram(
        "activity_login.png", "Activity Diagram Login",
        ["Admin / Kasir", "Sistem", "Database"],
        [("open", 0, 270, "Membuka halaman login"), ("form", 1, 270, "Menampilkan formulir login"),
         ("submit", 0, 520, "Mengisi username dan password"), ("error", 1, 770, "Menampilkan pesan kesalahan"),
         ("dashboard", 1, 1050, "Mengarahkan ke dashboard"), ("end", 0, 1210, "Masuk ke sistem")],
        [("check", 2, 520, "Validasi akun")],
    )
    activity_diagram(
        "activity_dashboard.png", "Activity Diagram Dashboard",
        ["Pengguna", "Sistem", "Database"],
        [("login", 0, 260, "Login berhasil"), ("request", 1, 260, "Meminta data ringkasan"),
         ("query", 2, 470, "Mengambil stok, transaksi, dan barang masuk"),
         ("state", 1, 680, "Mengolah state dashboard"), ("render", 1, 890, "Menampilkan ringkasan dan grafik"),
         ("refresh", 0, 1120, "Memuat ulang dashboard"), ("menu", 1, 1240, "Membuka menu terpilih")],
        [("choose", 0, 890, "Aksi pengguna")],
    )
    activity_diagram(
        "activity_admin.png", "Activity Diagram Dashboard Admin",
        ["Admin", "Sistem", "Database"],
        [("dash", 0, 250, "Membuka dashboard admin"), ("select", 0, 480, "Memilih fitur administrasi"),
         ("process", 1, 480, "Memproses data master / operasional"), ("error", 1, 760, "Menampilkan kesalahan"),
         ("save", 2, 760, "Menyimpan perubahan"), ("state", 1, 1010, "Mengirim state terbaru")],
        [("validate", 2, 480, "Validasi data")],
    )
    activity_diagram(
        "activity_cashier.png", "Activity Diagram Dashboard Kasir",
        ["Kasir", "Sistem", "Database"],
        [("dash", 0, 230, "Membuka menu kasir"), ("find", 0, 410, "Mencari dan memilih barang"),
         ("cart", 1, 410, "Menghitung keranjang dan total"), ("pay", 0, 760, "Memilih pelanggan dan pembayaran"),
         ("sale", 2, 980, "Menyimpan penjualan dan item"), ("reduce", 2, 1140, "Mengurangi stok barang"),
         ("receipt", 1, 1270, "Menampilkan dan mencetak struk")],
        [("stock", 2, 600, "Stok cukup?"), ("validate", 1, 900, "Pembayaran valid?")],
    )
    activity_diagram(
        "activity_user_management.png", "Activity Diagram Manajemen Pengguna",
        ["Admin", "Sistem", "Database"],
        [("menu", 0, 250, "Membuka menu pengguna"), ("list", 1, 250, "Menampilkan daftar pengguna"),
         ("form", 1, 570, "Menampilkan formulir pengguna"), ("delete", 1, 850, "Meminta konfirmasi hapus"),
         ("save", 2, 1030, "Menyimpan perubahan"),],
        [("action", 0, 410, "Pilih aksi"), ("validate", 2, 700, "Validasi data")],
    )


def sequence():
    w, h = 2200, 1400
    im = Image.new("RGB", (w, h), "white")
    d = ImageDraw.Draw(im)
    title(d, "Sequence Diagram Transaksi Penjualan", w)
    names = ["Kasir", "Antarmuka POS", "PosController", "Database", "Printer"]
    xs = [170, 620, 1080, 1540, 2020]
    for x, name in zip(xs, names):
        rounded(d, (x - 140, 130, x + 140, 220), name, 21, HEADER)
        line(d, [(x, 220), (x, 1320)], 3, "#8190a8")
    messages = [
        (0, 1, 300, "Pilih barang dan jumlah"),
        (1, 2, 430, "POST /checkout"),
        (2, 3, 560, "Validasi stok dan pelanggan"),
        (3, 2, 690, "Data valid"),
        (2, 3, 820, "Simpan sale dan sale_items"),
        (2, 3, 950, "Kurangi stok / catat hutang"),
        (3, 2, 1080, "Commit transaksi"),
        (2, 1, 1190, "Kirim state terbaru"),
        (1, 4, 1280, "Cetak struk"),
    ]
    for a, b, y, msg in messages:
        arrow(d, (xs[a], y), (xs[b], y), 3)
        text_box(d, ((xs[a] + xs[b]) / 2, y - 28), msg, 18)
    save(im, "sequence_transaksi.png")


def class_box(draw, x, y, w, title_text, attrs):
    h = 55 + len(attrs) * 29
    draw.rectangle((x, y, x + w, y + h), fill="white", outline=LINE, width=3)
    draw.rectangle((x, y, x + w, y + 55), fill=HEADER, outline=LINE, width=3)
    text_box(draw, (x + w / 2, y + 28), title_text, 20, True)
    for i, attr in enumerate(attrs):
        draw.text((x + 14, y + 68 + i * 29), attr, font=font(16), fill=INK)
    return (x, y, x + w, y + h)


def classes():
    w, h = 2400, 1600
    im = Image.new("RGB", (w, h), "white")
    d = ImageDraw.Draw(im)
    title(d, "Class Diagram Sistem POS TB. Losari Jaya 2", w)
    boxes = {
        "User": class_box(d, 80, 150, 360, "User", ["id", "name", "username", "role", "password"]),
        "Supplier": class_box(d, 510, 150, 360, "Supplier", ["id", "name", "phone", "address"]),
        "Item": class_box(d, 940, 130, 430, "InventoryItem", ["id", "name", "category_id", "unit_id", "supplier_id", "stock", "price", "purchase_price"]),
        "Category": class_box(d, 1440, 150, 360, "InventoryCategory", ["id", "name"]),
        "Unit": class_box(d, 1880, 150, 360, "InventoryUnit", ["id", "name"]),
        "Receipt": class_box(d, 80, 620, 380, "GoodsReceipt", ["id", "inventory_item_id", "supplier_id", "quantity", "unit_cost"]),
        "Sale": class_box(d, 540, 600, 390, "Sale", ["id", "user_id", "customer_id", "total", "payment_method", "status"]),
        "SaleItem": class_box(d, 1010, 620, 390, "SaleItem", ["id", "sale_id", "inventory_item_id", "quantity", "price"]),
        "Customer": class_box(d, 1480, 600, 390, "Customer", ["id", "name", "phone", "credit_limit"]),
        "Debt": class_box(d, 1950, 620, 360, "DebtPayment", ["id", "sale_id", "customer_id", "amount"]),
        "Void": class_box(d, 80, 1120, 380, "VoidLog", ["id", "sale_id", "user_id", "reason"]),
        "Return": class_box(d, 540, 1120, 390, "ReturnRequest", ["id", "sale_id", "user_id", "refund_total"]),
        "ReturnItem": class_box(d, 1010, 1120, 390, "ReturnItem", ["id", "return_request_id", "sale_item_id", "quantity"]),
        "Opname": class_box(d, 1480, 1120, 390, "StockOpname", ["id", "user_id", "notes"]),
        "OpnameItem": class_box(d, 1950, 1120, 360, "StockOpnameItem", ["id", "stock_opname_id", "inventory_item_id", "actual_stock"]),
    }
    links = [
        ("Supplier", "Item"), ("Category", "Item"), ("Unit", "Item"), ("Item", "Receipt"),
        ("User", "Sale"), ("Sale", "SaleItem"), ("Item", "SaleItem"), ("Customer", "Sale"),
        ("Customer", "Debt"), ("Sale", "Debt"), ("Sale", "Void"), ("Sale", "Return"),
        ("Return", "ReturnItem"), ("SaleItem", "ReturnItem"), ("User", "Opname"),
        ("Opname", "OpnameItem"), ("Item", "OpnameItem"),
    ]
    for a, b in links:
        aa, bb = boxes[a], boxes[b]
        ax, ay = (aa[0] + aa[2]) / 2, (aa[1] + aa[3]) / 2
        bx, by = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2
        line(d, [(ax, ay), (bx, by)], 2, "#77869d")
    save(im, "classdiagram_pos.png")


def erd():
    w, h = 2400, 1600
    im = Image.new("RGB", (w, h), "white")
    d = ImageDraw.Draw(im)
    title(d, "Entity Relationship Diagram Database Sistem POS", w)
    entities = [
        ("users", 80, 160, ["PK id", "name", "username", "role"]),
        ("suppliers", 500, 160, ["PK id", "name", "phone"]),
        ("inventory_items", 920, 140, ["PK id", "FK category_id", "FK unit_id", "FK supplier_id", "stock", "price"]),
        ("inventory_categories", 1480, 160, ["PK id", "name"]),
        ("inventory_units", 1940, 160, ["PK id", "name"]),
        ("goods_receipts", 80, 650, ["PK id", "FK inventory_item_id", "FK supplier_id", "quantity"]),
        ("sales", 510, 630, ["PK id", "FK user_id", "FK customer_id", "total", "status"]),
        ("sale_items", 960, 650, ["PK id", "FK sale_id", "FK inventory_item_id", "quantity"]),
        ("customers", 1480, 630, ["PK id", "name", "phone"]),
        ("debt_payments", 1940, 650, ["PK id", "FK sale_id", "FK customer_id", "amount"]),
        ("void_logs", 80, 1140, ["PK id", "FK sale_id", "FK user_id", "reason"]),
        ("return_requests", 500, 1140, ["PK id", "FK sale_id", "FK user_id"]),
        ("return_items", 940, 1140, ["PK id", "FK return_request_id", "FK sale_item_id"]),
        ("stock_opnames", 1480, 1140, ["PK id", "FK user_id", "notes"]),
        ("stock_opname_items", 1940, 1140, ["PK id", "FK stock_opname_id", "FK inventory_item_id"]),
    ]
    boxes = {}
    for name, x, y, attrs in entities:
        boxes[name] = class_box(d, x, y, 360, name, attrs)
    relations = [
        ("suppliers", "inventory_items"), ("inventory_categories", "inventory_items"),
        ("inventory_units", "inventory_items"), ("inventory_items", "goods_receipts"),
        ("suppliers", "goods_receipts"), ("users", "sales"), ("sales", "sale_items"),
        ("inventory_items", "sale_items"), ("customers", "sales"), ("sales", "debt_payments"),
        ("customers", "debt_payments"), ("sales", "void_logs"), ("sales", "return_requests"),
        ("return_requests", "return_items"), ("sale_items", "return_items"),
        ("users", "stock_opnames"), ("stock_opnames", "stock_opname_items"),
        ("inventory_items", "stock_opname_items"),
    ]
    for a, b in relations:
        aa, bb = boxes[a], boxes[b]
        ax, ay = (aa[0] + aa[2]) / 2, (aa[1] + aa[3]) / 2
        bx, by = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2
        line(d, [(ax, ay), (bx, by)], 2, "#718199")
        text_box(d, (ax + (bx - ax) * 0.18, ay + (by - ay) * 0.18 - 10), "1", 15)
        text_box(d, (ax + (bx - ax) * 0.82, ay + (by - ay) * 0.82 - 10), "N", 15)
    save(im, "erddiagram_pos.png")


if __name__ == "__main__":
    use_case()
    activities()
    sequence()
    classes()
    erd()
    print(f"Created revised diagrams in {OUT}")
