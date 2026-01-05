import requests
import os
import sys

def check_ip():
    proxy_url = os.getenv('PROXY_URL')
    print(f"DEBUG: PROXY_URL from env: {proxy_url}")
    
    if not proxy_url:
        print("No PROXY_URL set.")
        return

    # Ensure scheme
    if not proxy_url.startswith('http'):
        proxy_url = f'http://{proxy_url}'

    proxies = {
        "http": proxy_url,
        "https": proxy_url
    }

    # Browser UA
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    print("-" * 20)
    print("Testing connectivity...")
    
    try:
        # 1. Test without proxy (What is my real IP?)
        # timeout short to not hang
        # r_direct = requests.get('https://api.ipify.org?format=json', timeout=5)
        # print(f"Direct IP: {r_direct.json()['ip']}")
        pass 
    except Exception as e:
        print(f"Direct IP check failed: {e}")

    try:
        # 2. Test WITH proxy
        print(f"Testing WITH proxy: {proxy_url}")
        session = requests.Session()
        session.proxies = proxies
        session.headers.update(headers)
        
        # Check IP via HTTPS (Crucial as YouTube uses HTTPS)
        r = session.get('https://api.ipify.org?format=json', timeout=10)
        print(f"Proxy IP (via https://api.ipify.org): {r.text}")
        
        # Check Headers seen by server
        r_headers = session.get('https://httpbin.org/headers', timeout=10)
        print(f"Headers received by server: {r_headers.text}")
        
    except Exception as e:
        print(f"❌ Proxy request failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_ip()
