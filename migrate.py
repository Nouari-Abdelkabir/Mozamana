"""
ترحيل ملفات التوقيتات من البنية القديمة إلى الجديدة
القديم: alignments/001/mushaf_hafs__afs.json
الجديد: alignments/mushaf_hafs/001.json
"""

import json
from pathlib import Path
import shutil

BASE_DIR = Path(__file__).parent
ALIGNMENTS_DIR = BASE_DIR / "alignments"

# الملفات في البنية القديمة
old_pattern_files = list(ALIGNMENTS_DIR.glob('*/mushaf_*.json'))

if not old_pattern_files:
    print("✅ لا توجد ملفات للترحيل (البنية قد تكون محدثة بالفعل)")
else:
    print(f"🔄 وُجد {len(old_pattern_files)} ملف للترحيل")
    
    for old_file in old_pattern_files:
        # استخرج اسم المصحف من اسم الملف
        # mushaf_hafs__afs.json → mushaf_hafs
        filename = old_file.stem  # mushaf_hafs__afs
        mushaf_id = filename.split('__')[0]  # mushaf_hafs
        surah_num = old_file.parent.name  # 001
        
        # مسار جديد
        new_dir = ALIGNMENTS_DIR / mushaf_id
        new_dir.mkdir(exist_ok=True)
        new_file = new_dir / f"{surah_num}.json"
        
        # انقل الملف
        shutil.move(str(old_file), str(new_file))
        print(f"  ✅ {old_file} → {new_file}")
    
    # احذف المجلدات القديمة الفارغة
    for old_dir in ALIGNMENTS_DIR.iterdir():
        if old_dir.is_dir() and old_dir.name.isdigit():
            if not list(old_dir.iterdir()):  # فارغ
                old_dir.rmdir()
                print(f"  🗑️ حذف مجلد فارغ: {old_dir.name}")

print()
print("✅ اكتمل الترحيل")