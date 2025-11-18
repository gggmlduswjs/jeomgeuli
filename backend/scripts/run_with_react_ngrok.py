#!/usr/bin/env python3
"""
React 빌드 + Django + ngrok 완전 자동화 스크립트
- React 앱 빌드 (npm run build)
- Django 서버 실행 (React dist 서빙)
- ngrok 터널 자동 생성
- React 환경변수 자동 업데이트
- 터미널에 ASCII QR 코드 출력
- 스마트폰 접속 테스트 가능
"""

import subprocess
import requests
import time
import os
import qrcode
import sys
from pathlib import Path

# 현재 스크립트의 부모 디렉토리 (backend)로 이동
script_dir = Path(__file__).parent
backend_dir = script_dir.parent
frontend_dir = backend_dir.parent / "frontend"
os.chdir(backend_dir)

def build_react_app(force_rebuild=False):
    """React 앱 빌드"""
    print("📦 React 빌드 실행 중...")
    
    # 기존 빌드 파일 확인 (force_rebuild가 False일 때만)
    if not force_rebuild:
        dist_dir = frontend_dir / "dist"
        if dist_dir.exists() and (dist_dir / "index.html").exists():
            print("⚠️  기존 React 빌드 파일 발견! (환경변수 변경 시 재빌드 필요)")
            print("💡 환경변수가 변경되었다면 dist 폴더를 삭제하고 다시 실행하세요.")
    
    try:
        # npx를 사용하여 더 안전하게 실행
        npx_cmd = "npx"
        if os.name == 'nt':  # Windows
            npx_cmd = "npx.cmd"
        
        # npx vite build 실행
        result = subprocess.run(
            [npx_cmd, "vite", "build", "--mode", "production"],
            cwd=frontend_dir,
            capture_output=True,
            text=True,
            timeout=120  # 2분 타임아웃
        )
        
        if result.returncode == 0:
            print("✅ React 빌드 완료!")
            return True
        else:
            print(f"❌ React 빌드 실패: {result.stderr}")
            print("💡 수동으로 빌드해주세요: cd frontend && npx vite build")
            return False
    except subprocess.TimeoutExpired:
        print("❌ React 빌드 타임아웃 (2분 초과)")
        print("💡 수동으로 빌드해주세요: cd frontend && npx vite build")
        return False
    except Exception as e:
        print(f"❌ React 빌드 오류: {e}")
        print("💡 수동으로 빌드해주세요: cd frontend && npx vite build")
        return False

def update_frontend_env(ngrok_url):
    """React 프론트엔드 환경변수 파일들에 ngrok URL 반영"""
    print("4️⃣ React 환경변수 업데이트 중...")
    
    # .env.local 업데이트 (Vite용)
    frontend_env = frontend_dir / ".env.local"
    try:
        with open(frontend_env, "w", encoding="utf-8") as f:
            f.write(f"VITE_API_BASE_URL={ngrok_url}/api\n")
        print(f"✅ .env.local 업데이트: {frontend_env}")
    except Exception as e:
        print(f"❌ .env.local 업데이트 실패: {e}")
    
    # .env 업데이트 (React용)
    react_env = frontend_dir / ".env"
    try:
        with open(react_env, "w", encoding="utf-8") as f:
            f.write(f"REACT_APP_API_BASE={ngrok_url}/api\n")
        print(f"✅ .env 업데이트: {react_env}")
    except Exception as e:
        print(f"❌ .env 업데이트 실패: {e}")

def get_ngrok_url():
    """ngrok API를 통해 터널 URL 가져오기"""
    try:
        response = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=5)
        if response.status_code == 200:
            data = response.json()
            tunnels = data.get("tunnels", [])
            if tunnels:
                return tunnels[0].get("public_url")
    except Exception as e:
        print(f"⚠️  ngrok API 호출 실패: {e}")
    return None

def main():
    print("🚀 React 빌드 + Django + ngrok 완전 자동화 시작...")
    print(f"📁 백엔드 디렉토리: {backend_dir}")
    print(f"📁 프론트엔드 디렉토리: {frontend_dir}")
    
    try:
        # 1️⃣ Django 서버 실행
        print("\n1️⃣ Django 서버 시작 중...")
        django = subprocess.Popen([sys.executable, "manage.py", "runserver", "8000"])
        time.sleep(3)  # 서버 시작 대기
        
        # 2️⃣ ngrok 실행
        print("2️⃣ ngrok 터널 생성 중...")
        ngrok = subprocess.Popen(
            ["ngrok", "http", "8000", "--log=stdout"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        time.sleep(5)  # ngrok 초기화 대기
        
        # 3️⃣ ngrok URL 감지
        print("3️⃣ ngrok URL 감지 중...")
        url = get_ngrok_url()
        
        if not url:
            print("❌ ngrok URL을 가져올 수 없습니다.")
            print("💡 ngrok이 제대로 실행되었는지 확인하세요.")
            return
        
        print(f"✅ ngrok URL 감지: {url}")
        
        # 4️⃣ React 환경변수 업데이트 (빌드 전에!)
        print("4️⃣ React 환경변수 업데이트 중...")
        update_frontend_env(url)
        
        # 5️⃣ React 앱 빌드 (환경변수 반영된 상태로)
        print("\n5️⃣ React 앱 빌드 중 (환경변수 반영)...")
        if not build_react_app(force_rebuild=True):
            print("⚠️  React 빌드 실패했지만 계속 진행합니다.")
            print("💡 수동으로 빌드해주세요: cd frontend && npm run build")
        
        # 6️⃣ Django ALLOWED_HOSTS 안내
        print("\n✅ Django ALLOWED_HOSTS가 ngrok 도메인을 자동 허용합니다!")
        print("   (.ngrok-free.app, .ngrok.io 패턴 허용)")
        
        # 7️⃣ QR 코드 출력
        print("\n6️⃣ QR 코드 생성 중...")
        try:
            qr = qrcode.QRCode(border=1)
            qr.add_data(url)
            qr.make()
            qr.print_ascii(invert=True)
            print(f"\n📱 스마트폰에서 QR 코드 스캔하여 접속: {url}")
        except Exception as e:
            print(f"❌ QR 코드 생성 오류: {e}")
            print(f"🔗 수동 접속: {url}")
        
        # 8️⃣ 테스트 안내
        print("\n⚠️  중요: 환경변수가 변경되었으므로 React 앱이 재빌드되었습니다.")
        print("   이제 ngrok URL로 API 호출이 정상적으로 작동합니다!")
        print("\n" + "="*60)
        print("🎉 React + Django + ngrok 완전 자동화 완료!")
        print("="*60)
        print(f"📱 스마트폰 접속: {url}")
        print("🖥️  로컬 접속: http://localhost:8000")
        print("\n📋 테스트 방법:")
        print("1. 스마트폰에서 QR 코드 스캔 또는 URL 직접 접속")
        print("2. React 앱이 Django에서 서빙됨")
        print("3. 루트('/') 접속 → 서버 상태 JSON 확인")
        print("4. '정보탐색' 버튼 클릭 → GPT 답변 + 네이버 뉴스 5개")
        print("\n🔗 API 엔드포인트:")
        print(f"   • React 앱: {url}/")
        print(f"   • 서버 상태: {url}/")
        print(f"   • 정보탐색: {url}/api/explore?q=AI")
        print(f"   • 뉴스만: {url}/api/news?q=AI")
        print(f"   • 헬스체크: {url}/api/health")
        print("\n💡 특징:")
        print("   • React 앱이 Django에서 서빙됨")
        print("   • SPA 라우팅 지원")
        print("   • API 호출이 ngrok URL로 자동 연결됨")
        print("\n⏹️  종료하려면 Ctrl+C를 누르세요...")
        print("="*60)
        
        # 9️⃣ 프로세스 유지
        try:
            django.wait()
        except KeyboardInterrupt:
            print("\n🛑 서버 종료 중...")
            django.terminate()
            ngrok.terminate()
            print("✅ 종료 완료!")
            
    except FileNotFoundError:
        print("❌ ngrok이 설치되지 않았습니다.")
        print("💡 설치 방법:")
        print("   1. https://ngrok.com/download 에서 다운로드")
        print("   2. ngrok 계정 생성 후 토큰 설정:")
        print("      ngrok config add-authtoken YOUR_TOKEN")
    except Exception as e:
        print(f"❌ 실행 오류: {e}")

if __name__ == "__main__":
    main()
