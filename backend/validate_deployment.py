#!/usr/bin/env python3
"""
Script de validación pre-despliegue
Verifica que el backend esté listo para Railway
"""

import os
import sys
import json
from pathlib import Path

class Colors:
    OK = '\033[92m'
    ERROR = '\033[91m'
    WARN = '\033[93m'
    INFO = '\033[94m'
    END = '\033[0m'

def check(condition, message):
    if condition:
        print(f"{Colors.OK}✓{Colors.END} {message}")
        return True
    else:
        print(f"{Colors.ERROR}✗{Colors.END} {message}")
        return False

def warn(message):
    print(f"{Colors.WARN}!{Colors.END} {message}")

def info(message):
    print(f"{Colors.INFO}ℹ{Colors.END} {message}")

print(f"\n{Colors.INFO}═══════════════════════════════════════════{Colors.END}")
print(f"{Colors.INFO}Backend Pre-Deployment Validation{Colors.END}")
print(f"{Colors.INFO}═══════════════════════════════════════════{Colors.END}\n")

passed = 0
failed = 0

# 1. Verificar estructura de carpetas
print(f"{Colors.INFO}Checking directory structure...{Colors.END}")
required_dirs = [
    "app",
    "app/core",
    "app/models",
    "app/routers",
    "app/schemas",
    "app/services",
    "alembic",
]

for d in required_dirs:
    if check(os.path.isdir(d), f"Directory '{d}' exists"):
        passed += 1
    else:
        failed += 1

# 2. Verificar archivos críticos
print(f"\n{Colors.INFO}Checking critical files...{Colors.END}")
required_files = [
    "main.py",
    "requirements.txt",
    "Dockerfile",
    "app/core/config.py",
    "app/core/database.py",
    "app/core/security.py",
]

for f in required_files:
    if check(os.path.isfile(f), f"File '{f}' exists"):
        passed += 1
    else:
        failed += 1

# 3. Verificar requirements.txt
print(f"\n{Colors.INFO}Checking requirements.txt...{Colors.END}")
try:
    with open("requirements.txt", "r") as f:
        reqs = f.read()
    
    required_packages = ["fastapi", "uvicorn", "sqlalchemy", "pydantic"]
    for pkg in required_packages:
        if check(pkg in reqs, f"Dependency '{pkg}' is listed"):
            passed += 1
        else:
            failed += 1
            
    # Verificar que no hay líneas vacías o comentarios rotos
    lines = [l.strip() for l in reqs.split('\n') if l.strip() and not l.startswith('#')]
    valid = True
    for line in lines:
        if '===' in line or '--only-binary' in line:
            valid = False
            warn(f"Problematic line in requirements.txt: {line[:50]}...")
    
    if check(valid, "requirements.txt format is clean"):
        passed += 1
    else:
        failed += 1
        
except Exception as e:
    print(f"{Colors.ERROR}✗{Colors.END} Error reading requirements.txt: {e}")
    failed += 1

# 4. Verificar main.py
print(f"\n{Colors.INFO}Checking main.py...{Colors.END}")
try:
    with open("main.py", "r") as f:
        main_content = f.read()
    
    checks_main = [
        ("FastAPI app creation", "FastAPI(" in main_content),
        ("CORS configuration", "CORSMiddleware" in main_content),
        ("Health endpoint", "@app.get" in main_content and "health" in main_content),
        ("Lifespan handler", "@asynccontextmanager" in main_content or "lifespan" in main_content),
        ("Main entry point", 'if __name__ == "__main__"' in main_content),
    ]
    
    for check_name, result in checks_main:
        if check(result, f"main.py has {check_name}"):
            passed += 1
        else:
            failed += 1
            
except Exception as e:
    print(f"{Colors.ERROR}✗{Colors.END} Error reading main.py: {e}")
    failed += 1

# 5. Verificar configuración core
print(f"\n{Colors.INFO}Checking core configuration...{Colors.END}")
try:
    with open("app/core/config.py", "r") as f:
        config_content = f.read()
    
    checks_config = [
        ("Settings class", "class Settings" in config_content),
        ("DATABASE_URL support", "DATABASE_URL" in config_content),
        ("get_database_url method", "get_database_url" in config_content),
        ("CORS origins list", "cors_origins_list" in config_content),
    ]
    
    for check_name, result in checks_config:
        if check(result, f"config.py has {check_name}"):
            passed += 1
        else:
            failed += 1
            
except Exception as e:
    print(f"{Colors.ERROR}✗{Colors.END} Error reading config.py: {e}")
    failed += 1

# 6. Verificar Dockerfile
print(f"\n{Colors.INFO}Checking Dockerfile...{Colors.END}")
try:
    with open("Dockerfile", "r") as f:
        dockerfile = f.read()
    
    checks_docker = [
        ("Python base image", "FROM python:" in dockerfile),
        ("WORKDIR set", "WORKDIR" in dockerfile),
        ("requirements.txt copied", "COPY requirements.txt" in dockerfile),
        ("pip install", "pip install" in dockerfile),
        ("Expose port 8000", "EXPOSE 8000" in dockerfile),
        ("No --reload flag", "--reload" not in dockerfile),
    ]
    
    for check_name, result in checks_docker:
        if check(result, f"Dockerfile: {check_name}"):
            passed += 1
        else:
            failed += 1
            
except Exception as e:
    print(f"{Colors.ERROR}✗{Colors.END} Error reading Dockerfile: {e}")
    failed += 1

# 7. Verificar .gitignore
print(f"\n{Colors.INFO}Checking .gitignore...{Colors.END}")
if os.path.isfile(".gitignore"):
    with open(".gitignore", "r") as f:
        gitignore = f.read()
    
    checks_git = [
        ("__pycache__", "__pycache__" in gitignore),
        ("*.pyc", "*.pyc" in gitignore),
        (".env", ".env" in gitignore),
        (".venv", ".venv" in gitignore),
        ("*.log", "*.log" in gitignore),
    ]
    
    for check_name, result in checks_git:
        if check(result, f".gitignore contains '{check_name}'"):
            passed += 1
        else:
            failed += 1
    
    check(True, ".gitignore exists")
    passed += 1
else:
    warn(".gitignore not found in root")
    failed += 1

# 8. Advertencias
print(f"\n{Colors.WARN}Deployment Warnings:{Colors.END}")
if os.path.isfile(".env"):
    warn(".env file found — make sure NOT to commit it")
if os.path.isfile(".env.production"):
    info(".env.production template found (use in Railway dashboard)")

# Summary
print(f"\n{Colors.INFO}═══════════════════════════════════════════{Colors.END}")
print(f"{Colors.INFO}Summary{Colors.END}")
print(f"{Colors.INFO}═══════════════════════════════════════════{Colors.END}")
print(f"{Colors.OK}Passed: {passed}{Colors.END}")
print(f"{Colors.ERROR}Failed: {failed}{Colors.END}")

if failed == 0:
    print(f"\n{Colors.OK}✓ Backend is ready for deployment to Railway!{Colors.END}\n")
    sys.exit(0)
else:
    print(f"\n{Colors.ERROR}✗ Fix the issues above before deploying{Colors.END}\n")
    sys.exit(1)
