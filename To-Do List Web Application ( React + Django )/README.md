
![interface (2)](https://github.com/user-attachments/assets/a2c89a95-b773-4d78-8361-14b4db8855b2)


#![Uploading interface (2).png…]()
 Djang![Uploading interface (2).png…]()
o + React To-Do App

## Quick Setup

Follow these steps to get the project running on your local machine:

### 1. Create a Python virtual environment

```bash
python -m venv env
.\env\Scriptsactivate
```

### 2. Clone the project

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd django-todo-react
```

### 3. Install backend dependencies and set up Django

Make sure Python is installed. Then run:

```bash
pip install django
pip install djangorestframework
pip install django-cors-headers
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic
python manage.py createsuperuser  # Set up your admin account
python manage.py runserver
```

The backend will start on:  
👉 http://127.0.0.1:8000/

- Admin panel: http://127.0.0.1:8000/admin/

---

### 4. Launch the frontend (React)

In a separate terminal:

```bash
cd frontend
npm install
export NODE_OPTIONS=--openssl-legacy-provider  # If using Git Bash/Linux
npm start
```

Or for Windows PowerShell:

```powershell
$env:NODE_OPTIONS="--openssl-legacy-provider"
npm start
```

The frontend will run on:  
👉 http://localhost:3000/

---

### 5. Test the App

- Go to http://localhost:3000
- Sign up or log in
- Create, view, and manage your to-do items
