# API ARTEC v2 (Express + MongoDB)
Prérequis : Node 18+, MongoDB Community démarré (ou MongoDB Atlas dans MONGODB_URI).
Windows (cmd) :
    copy .env.example .env      (modifier JWT_SECRET et IP_SALT)
    npm install
    npm run seed
    npm run dev
Test : http://localhost:5000/api/health
