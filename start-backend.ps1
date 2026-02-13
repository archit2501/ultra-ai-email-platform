cd "c:\Users\U6076979\Downloads\codes\cold email\COLD-EMAIL-WEB-APPLICATION\backend"
$env:PYTHONIOENCODING="utf-8"
& "C:/Users/U6076979/Downloads/codes/cold email/.venv/Scripts/python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
