import requests

url = 'https://media1.vocaroo.com/mp3/13ByKGcYGqyq'
headers = {
    'Referer': 'https://vocaroo.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}

print(f"Downloading from {url}...")
try:
    response = requests.get(url, headers=headers, stream=True)
    if response.status_code == 200:
        with open('public/audio/claridad.mp3', 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print("Success: claridad.mp3 saved.")
    else:
        print(f"Failed: Status code {response.status_code}")
        print(response.text[:200])
except Exception as e:
    print(f"Error: {e}")
