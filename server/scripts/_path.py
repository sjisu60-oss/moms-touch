"""scripts 폴더의 프로그램이 server 폴더의 코드를 불러올 수 있게 경로를 추가합니다."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
