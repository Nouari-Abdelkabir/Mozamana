"""
خادم وقف - Miqat Server
خادم بسيط بـ Python لخدمة الواجهة وإدارة ملفات التوقيتات
"""

import http.server
import json
import os
from urllib.parse import urlparse
from pathlib import Path

# المسار الأساسي للمشروع
BASE_DIR = Path(__file__).parent
ALIGNMENTS_DIR = BASE_DIR / "alignments"

# إنشاء مجلد alignments إذا لم يكن موجوداً
ALIGNMENTS_DIR.mkdir(exist_ok=True)


class MiqatHandler(http.server.SimpleHTTPRequestHandler):
    """معالج الطلبات - يخدم الملفات ويدير API التوقيتات"""

    def __init__(self, *args, **kwargs):
        # خدمة الملفات من مجلد المشروع
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def do_GET(self):
        """معالجة طلبات GET"""
        parsed = urlparse(self.path)
        path = parsed.path

        # API: جلب توقيتات
        if path.startswith('/api/alignment/'):
            self.handle_get_alignment(path)
            return

        # API: قائمة التوقيتات
        if path == '/api/alignment-list':
            self.handle_list_alignments()
            return

        # خدمة الملفات العادية
        super().do_GET()

    def do_POST(self):
        """معالجة طلبات POST"""
        parsed = urlparse(self.path)
        path = parsed.path

        # API: حفظ توقيتات
        if path.startswith('/api/alignment/'):
            self.handle_save_alignment(path)
            return

        self.send_error(404, "Not Found")

    def do_PUT(self):
        """معالجة طلبات PUT (نفس POST)"""
        self.do_POST()

    def do_OPTIONS(self):
        """معالجة CORS preflight"""
        self.send_response(200)
        self.end_headers()

    # ============================================================
    # دوال المساعدة
    # ============================================================

    def handle_get_alignment(self, path):
        """جلب: /api/alignment/{mushaf_id}/{reciter_id}/{surah}"""
        # المسار الجديد: /api/alignment/{mushaf_id}/{surah_num}
        # مثال: /api/alignment/mushaf_hafs/001
        parts = path.replace('/api/alignment/', '').split('/')

        if len(parts) != 3:
            self.send_json_response({"status": "error", "message": f"Invalid path: expected 3 parts, got {len(parts)}"})
            return

        mushaf_id, reciter_id, surah_num = parts

        # alignments/{mushaf_id}/{reciter_id}/{surah}.json
        file_path = ALIGNMENTS_DIR / mushaf_id / reciter_id / f"{surah_num.zfill(3)}.json"

        if not file_path.exists():
            self.send_json_response({"status": "not_found"})
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.send_json_response({"status": "found", "data": data})

    def handle_save_alignment(self, path):
        """حفظ: /api/alignment/{mushaf_id}/{reciter_id}/{surah}"""
        parts = path.replace('/api/alignment/', '').split('/')

        if len(parts) != 3:
            self.send_json_response({"status": "error", "message": f"Invalid path: expected 3 parts, got {len(parts)}"})
            return

        mushaf_id, reciter_id, surah_num = parts

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        try:
            data = json.loads(body.decode('utf-8'))
        except json.JSONDecodeError as e:
            self.send_json_response({"status": "error", "message": f"Invalid JSON: {e}"})
            return

        # إنشاء المجلدات
        target_dir = ALIGNMENTS_DIR / mushaf_id / reciter_id
        target_dir.mkdir(parents=True, exist_ok=True)

        file_path = target_dir / f"{surah_num.zfill(3)}.json"
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        self.send_json_response({
            "status": "saved",
            "path": str(file_path)
        })

  

    def handle_list_alignments(self):
        """قائمة كل التوقيتات المتاحة (البنية الجديدة: mushaf_id/surah.json)"""
        items = []

        if ALIGNMENTS_DIR.exists():
            # المرور على كل مجلد مصحف
            for mushaf_dir in sorted(ALIGNMENTS_DIR.iterdir()):
                if not mushaf_dir.is_dir():
                    continue

                # المرور على كل ملف JSON داخل المجلد
                for json_file in sorted(mushaf_dir.glob('*.json')):
                    items.append({
                        "mushaf_id": mushaf_dir.name,
                        "surah": json_file.stem,  # 001, 002, ...
                        "file": f"{mushaf_dir.name}/{json_file.name}"
                    })

        self.send_json_response({"total": len(items), "items": items})

    def send_json_response(self, data):
        """إرسال رد JSON"""
        response = json.dumps(data, ensure_ascii=False)
        response_bytes = response.encode('utf-8')

        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(response_bytes)

    def end_headers(self):
        """إضافة headers للأمان"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        """تخصيص رسائل السجل - عرض مختصر"""
        # نعرض فقط الطلبات المهمة
        message = args[0] if args else ''
        print(f"📡 {message}")


def run_server(port=8000):
    """تشغيل الخادم"""
    server_address = ('', port)

    try:
        httpd = http.server.HTTPServer(server_address, MiqatHandler)
    except OSError as e:
        print(f"❌ خطأ: المنفذ {port} مستخدم بالفعل.")
        print(f"💡 جرّب تغيير الرقم إلى 8080 مثلاً")
        return

    print("=" * 60)
    print("🕌 خادم وقف - Miqat Server")
    print("=" * 60)
    print(f"✅ الخادم يعمل على: http://localhost:{port}")
    print(f"📁 مجلد التوقيتات: {ALIGNMENTS_DIR}")
    print()
    print("💡 لإيقاف الخادم: اضغط Ctrl+C")
    print("=" * 60)
    print()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 تم إيقاف الخادم")


if __name__ == '__main__':
    run_server(8000)