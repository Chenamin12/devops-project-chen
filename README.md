# 🛒 פרויקט ניהול רשימות קניות - DevOps Project

## תיאור הפרויקט

זהו פרויקט DevOps מלא המכיל אפליקציית ניהול רשימות קניות עם מערכת CI/CD מתקדמת. הפרויקט כולל אפליקציית Full-Stack עם Backend ב-Node.js, Frontend ב-Vanilla JavaScript, מסד נתונים MongoDB, וכל תהליכי ה-DevOps לביצוע בדיקות אוטומטיות, בניית תמונות Docker, ופריסה אוטומטית לשרת EC2.

## טכנולוגיות

- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: MongoDB 7.0
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Nginx עם Load Balancing
- **CI/CD**: GitHub Actions
- **Cloud**: AWS EC2
- **Testing**: Jest, Supertest

---

## 📋 סקירה כללית של האפליקציה

### מה האפליקציה עושה?

האפליקציה מאפשרת למשתמשים לנהל רשימות קניות אישיות עם התכונות הבאות:

- **ניהול משתמשים**: הרשמה, התחברות, ואימות JWT
- **רשימות קניות**: יצירה, צפייה, מחיקה של רשימות קניות
- **מוצרים**: הוספה, עדכון, מחיקה של מוצרים ברשימה
- **תמונות**: העלאת תמונות למוצרים
- **מעקב**: סימון מוצרים כ-"נקנו"
- **לוח שנה**: ניהול תזכורות על רשימות קניות

### מבנה התיקיות

```
devops-project-chen/
├── client/                 # Frontend application
│   ├── css/               # Styles
│   ├── js/                # JavaScript modules
│   ├── index.html         # Main HTML file
│   ├── Dockerfile         # Client Docker image
│   └── nginx.conf         # Nginx config for client
├── server/                # Backend application
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── tests/             # Test files
│   ├── Dockerfile         # Server Docker image
│   └── server.js          # Entry point
├── nginx/                 # Nginx configuration for load balancing
│   └── nginx.conf
├── .github/
│   └── workflows/
│       └── tests.yml      # CI/CD pipeline
├── docker-compose.yml     # Local development setup
└── deploy.sh              # Deployment script for EC2
```

---

## 🏗️ ארכיטקטורת המערכת

### תרשים זרימת הנתונים

```mermaid
graph TB
    User[משתמש] --> Nginx[Nginx Load Balancer<br/>Port 80]
    Nginx --> Client[Client Container<br/>Frontend]
    Nginx --> API1[API Instance 1<br/>Port 3000]
    Nginx --> API2[API Instance 2<br/>Port 3000]
    Nginx --> API3[API Instance 3<br/>Port 3000]
    API1 --> MongoDB[(MongoDB<br/>Port 27017)]
    API2 --> MongoDB
    API3 --> MongoDB
    MongoDB --> MongoExpress[Mongo Express<br/>Port 8081]

    style Nginx fill:#4CAF50
    style Client fill:#2196F3
    style API1 fill:#FF9800
    style API2 fill:#FF9800
    style API3 fill:#FF9800
    style MongoDB fill:#47A248
    style MongoExpress fill:#43B02A
```

### השירותים במערכת

1. **Nginx** - Reverse Proxy ו-Load Balancer
   - ממנו לשלושה instances של ה-API
   - מנתב בקשות ל-Frontend או Backend לפי ה-URL
   - מבצע Health Checks

2. **Client Container** - אפליקציית Frontend
   - משרתת קבצי HTML, CSS, JavaScript סטטיים
   - רץ על Nginx Alpine

3. **API Instances (3x)** - אפליקציית Backend
   - שלושה instances זהים לטובת Load Balancing
   - כל אחד רץ על פורט 3000
   - מתחברים לאותו MongoDB

4. **MongoDB** - מסד הנתונים
   - מאחסן משתמשים, רשימות קניות, ומוצרים
   - עם Authentication מובנה

5. **Mongo Express** - כלי ניהול למסד הנתונים
   - ממשק וובי לניהול MongoDB
   - זמין על פורט 8081

---

## 🚀 תהליך CI/CD - GitHub Actions Pipeline

המערכת כוללת Pipeline מתקדם המבוצע אוטומטית עם כל Push ל-repository. ה-Pipeline מוגדר בקובץ [`.github/workflows/tests.yml`](.github/workflows/tests.yml) וכולל 4 Jobs עיקריים.

### תרשים CI/CD Pipeline

```mermaid
graph LR
    Trigger[Push to main/master/develop] --> TestJob[Job: Test]
    TestJob -->|Success| BuildJob[Job: Build and Push]
    TestJob -->|Failure| Notify[Job: Notify on Failure]
    BuildJob -->|Success & main/master| DeployJob[Job: Deploy to EC2]
    BuildJob -->|Failure| Notify
    DeployJob -->|Failure| Notify
    DeployJob -->|Success| Complete[Deployment Complete]

    style TestJob fill:#4CAF50
    style BuildJob fill:#2196F3
    style DeployJob fill:#FF9800
    style Notify fill:#F44336
    style Complete fill:#4CAF50
```

### Job 1: Test

**מתי רץ?** על כל Push או Pull Request ל-branches: `main`, `master`, `develop`

**מטרה:** הרצת כל בדיקות ה-unit tests ו-integration tests

**פירוט צעדים:**

1. **Checkout code**

   ```yaml
   - uses: actions/checkout@v3
   ```

   מוריד את הקוד מה-repository

2. **Setup Node.js** (Matrix Strategy)

   ```yaml
   strategy:
     matrix:
       node-version: [18.x, 20.x]
   ```

   מריץ את הבדיקות על שתי גרסאות Node.js (18.x ו-20.x) במקביל כדי לוודא תאימות

3. **Cache dependencies**

   ```yaml
   cache: "npm"
   cache-dependency-path: server/package-lock.json
   ```

   משתמש ב-cache של npm להאצת ההתקנה

4. **Install dependencies**

   ```bash
   npm ci
   ```

   מתקין את כל התלויות מתוך `server/package-lock.json` (npm ci מהיר יותר מ-npm install)

5. **Run tests**

   ```bash
   npm run test:ci
   ```

   מריץ את כל הבדיקות עם Jest, ב-mode CI (ללא watch mode)

   **Environment Variables:**
   - `JWT_SECRET`: מפתח להצפנת JWT tokens
   - `JWT_EXPIRE`: משך תוקף של tokens (7d)
   - `UPLOAD_PATH`: נתיב לתיקיית העלאות
   - `MAX_FILE_SIZE`: גודל מקסימלי של קבצים

6. **Upload coverage** (רק בגרסה 20.x)
   ```yaml
   - uses: codecov/codecov-action@v3
   ```
   מעלה דוחות כיסוי קוד ל-Codecov לניתוח

**תוצאה:** אם כל הבדיקות עוברות, ה-Job הבא מתחיל. אם יש כשל, ה-Pipeline נעצר והתראה נשלחת.

---

### Job 2: Build and Push

**מתי רץ?** רק לאחר ש-Job ה-Test הצליח **וגם** רק על Push (לא על Pull Request) **וגם** רק על branches: `main`, `master`, `develop`

**מטרה:** בניית תמונות Docker ופרסומן ל-Docker Hub

**תלות:** `needs: test` - יוצא לדרך רק אם כל ה-tests עברו

**פירוט צעדים:**

1. **Checkout code**

   ```yaml
   - uses: actions/checkout@v3
   ```

   מוריד את הקוד עם כל ה-Dockerfiles

2. **Setup Docker Buildx**

   ```yaml
   - uses: docker/setup-buildx-action@v3
   ```

   מכין את Docker Buildx לבניית תמונות מתקדמת (תמיכה ב-multi-platform, caching, וכו')

3. **Login to Docker Hub**

   ```yaml
   - uses: docker/login-action@v3
     with:
       username: ${{ secrets.DOCKER_USERNAME }}
       password: ${{ secrets.DOCKER_TOKEN }}
   ```

   מתחבר ל-Docker Hub באמצעות credentials מה-GitHub Secrets

4. **Extract metadata for Server Image**

   ```yaml
   - uses: docker/metadata-action@v5
     with:
       images: ${{ secrets.DOCKER_USERNAME }}/shopping-list-api
       tags: |
         type=ref,event=branch    # שם ה-branch
         type=ref,event=pr        # מספר PR
         type=semver,pattern={{version}}
         type=semver,pattern={{major}}.{{minor}}
         type=sha,prefix={{branch}}-  # SHA של commit
         type=raw,value=latest,enable={{is_default_branch}}
   ```

   יוצר תגים אוטומטיים לתמונת ה-API בהתאם ל-branch ול-commit:
   - על `main`: `latest`, `main`, `main-<sha>`
   - על `develop`: `develop`, `develop-<sha>`

5. **Build and Push Server Image**

   ```yaml
   - uses: docker/build-push-action@v5
     with:
       context: ./server
       file: ./server/Dockerfile
       push: true
       tags: ${{ steps.meta-server.outputs.tags }}
       labels: ${{ steps.meta-server.outputs.labels }}
       cache-from: type=registry,ref=.../shopping-list-api:buildcache
       cache-to: type=registry,ref=.../shopping-list-api:buildcache,mode=max
   ```

   **מה קורה כאן?**
   - בונה תמונת Docker מה-`server/Dockerfile`
   - משתמש ב-Registry Cache להאצה - אם שכבות לא השתנו, לא יבנה אותן מחדש
   - מעלה את התמונה ל-Docker Hub עם כל התגים שנוצרו
   - התמונה: `DOCKER_USERNAME/shopping-list-api:latest`

6. **Extract metadata for Client Image**
   - אותו תהליך כמו ל-Server, עבור התמונה `shopping-list-client`

7. **Build and Push Client Image**
   ```yaml
   context: ./client
   file: ./client/Dockerfile
   ```

   - בונה תמונת Frontend מה-`client/Dockerfile`
   - מעלה ל-Docker Hub: `DOCKER_USERNAME/shopping-list-client:latest`

**תוצאה:** שתי תמונות Docker זמינות ב-Docker Hub ומוכנות לפריסה.

**Cache Strategy:**
המערכת משתמשת ב-Registry Cache - התמונות נשמרות עם תג `buildcache` כדי להאיץ builds עתידיים. אם הקוד ב-`server/` לא השתנה, הבנייה תהיה מהירה מאוד.

---

### Job 3: Deploy to EC2

**מתי רץ?** רק לאחר ש-Build and Push הצליח **וגם** רק על Push (לא PR) **וגם** רק על branches: `main` או `master` (לא `develop`)

**מטרה:** פריסה אוטומטית של האפליקציה לשרת EC2

**תלות:** `needs: build-and-push` - רק אם התמונות נבנו והועלו בהצלחה

**פירוט צעדים:**

1. **Checkout code**

   ```yaml
   - uses: actions/checkout@v3
   ```

   מוריד את הקוד, כולל את `deploy.sh`

2. **Configure SSH**

   ```yaml
   env:
     SSH_KEY: ${{ secrets.EC2_SSH_KEY }}
     EC2_HOST: ${{ secrets.EC2_HOST }}
   run: |
     mkdir -p ~/.ssh
     chmod 700 ~/.ssh
     echo "$SSH_KEY" > ~/.ssh/ec2_key.pem
     chmod 600 ~/.ssh/ec2_key.pem
     ssh-keyscan -H "$EC2_HOST" >> ~/.ssh/known_hosts
   ```

   **מה קורה?**
   - יוצר תיקיית `.ssh` מאובטחת
   - שומר את מפתח ה-SSH מה-GitHub Secrets
   - מוסיף את כתובת ה-EC2 ל-`known_hosts` כדי להימנע מאימות ידני

3. **Copy deployment script to EC2**

   ```yaml
   run: |
     scp -i ~/.ssh/ec2_key.pem -o StrictHostKeyChecking=no \
       deploy.sh ${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }}:~/deploy.sh
   ```

   מעתיק את סקריפט הפריסה (`deploy.sh`) לשרת EC2 דרך SCP

4. **Run deployment on EC2**

   ```yaml
   run: |
     ssh -i ~/.ssh/ec2_key.pem ${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }} << EOF
       chmod +x ~/deploy.sh
       export DOCKER_USERNAME="$DOCKER_USERNAME"
       export DOCKER_TOKEN="$DOCKER_TOKEN"
       # ... כל ה-secrets האחרים
       ~/deploy.sh
     EOF
   ```

   **מה קורה כאן?**
   - מתחבר לשרת EC2 דרך SSH
   - מגדיר הרשאות ביצוע לסקריפט
   - מעביר את כל ה-environment variables (secrets) לשרת
   - מריץ את `deploy.sh` על השרת

   **Secrets שעוברים:**
   - `DOCKER_USERNAME`, `DOCKER_TOKEN` - התחברות ל-Docker Hub
   - `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD` - MongoDB credentials
   - `MONGO_DATABASE` - שם מסד הנתונים
   - `JWT_SECRET`, `JWT_EXPIRE` - JWT configuration
   - `MONGO_EXPRESS_USERNAME`, `MONGO_EXPRESS_PASSWORD` - Mongo Express credentials
   - `UPLOAD_PATH`, `MAX_FILE_SIZE` - File upload settings

5. **Verify deployment**
   ```yaml
   run: |
     ssh -i ~/.ssh/ec2_key.pem ${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }} << 'ENDSSH'
       cd ~/shopping-list-app
       docker-compose ps  # או docker compose ps
     ENDSSH
   ```
   בודק שהכל רץ - מציג את סטטוס כל ה-containers

**תוצאה:** האפליקציה פרוסה ופועלת על EC2, זמינה ב-`http://EC2_HOST`.

---

### Job 4: Notify on Failure

**מתי רץ?** רק אם אחד מה-Jobs נכשל: `test`, `build-and-push`, או `deploy-to-ec2`

**מטרה:** שליחת התראה באימייל בעת כשל

**תנאים:**

```yaml
if: always() && (needs.test.result == 'failure' ||
  needs.build-and-push.result == 'failure' ||
  (needs.deploy-to-ec2.result == 'failure' && needs.deploy-to-ec2.result != 'skipped'))
```

**צעדים:**

1. **Send email notification**

   ```yaml
   - uses: dawidd6/action-send-mail@v3
     with:
       server_address: smtp.gmail.com
       server_port: 465
       username: ${{ secrets.EMAIL_USERNAME }}
       password: ${{ secrets.EMAIL_PASSWORD }}
       subject: "❌ CI Tests Failed - ${{ github.repository }}"
       to: ${{ secrets.EMAIL_TO }}
       from: ${{ secrets.EMAIL_FROM }}
   ```

   שולח אימייל עם פרטי הכשל:
   - שם ה-workflow
   - Branch ו-Commit
   - קישור ל-workflow run

---

## 📜 סקריפט הפריסה - deploy.sh

סקריפט הפריסה [`deploy.sh`](deploy.sh) הוא לב תהליך הפריסה. הוא רץ על שרת ה-EC2 ומבצע את כל הפעולות הנדרשות להפעלת האפליקציה.

### זרימת הביצוע של deploy.sh

```mermaid
flowchart TD
    Start[התחלה] --> CheckDocker{האם Docker מותקן?}
    CheckDocker -->|לא| InstallDocker[התקן Docker]
    CheckDocker -->|כן| DockerCompose
    InstallDocker --> DockerCompose{בדוק Docker Compose}
    DockerCompose --> Login[התחבר ל-Docker Hub]
    Login --> Pull[משוך תמונות Docker]
    Pull --> CreateDirs[צור תיקיות]
    CreateDirs --> CreateEnv[צור .env file]
    CreateEnv --> CreateNginx[צור nginx.conf]
    CreateNginx --> CreateDockerCompose[צור docker-compose.yml]
    CreateDockerCompose --> Stop[עצור containers קיימים]
    Stop --> Start[הפעל containers חדשים]
    Start --> Wait[המתן 10 שניות]
    Wait --> Status[בדוק סטטוס]
    Status --> Logs[הצג logs]
    Logs --> End[סיום]

    style Start fill:#4CAF50
    style InstallDocker fill:#FF9800
    style Login fill:#2196F3
    style CreateEnv fill:#9C27B0
    style Start fill:#4CAF50
    style End fill:#4CAF50
```

### פירוט צעד אחר צעד

#### 1. התקנת Docker

```bash
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not found. Installing Docker..."
    sudo apt-get update
    # ... התקנה מלאה של Docker CE
fi
```

**מה קורה?**

- בודק אם Docker מותקן
- אם לא - מתקין את Docker CE כולל:
  - Docker Engine
  - Docker CLI
  - Containerd
  - Docker Buildx plugin
  - Docker Compose plugin
- מאפשר הרצת Docker ללא `sudo` (אופציונלי)

**בדיקת Docker Compose:**
הסקריפט תומך גם ב-Docker Compose v1 (standalone) וגם v2 (plugin):

```bash
if docker compose version &> /dev/null; then
    # Docker Compose v2 (מומלץ)
elif command -v docker-compose &> /dev/null; then
    # Docker Compose v1 (legacy)
fi
```

#### 2. Docker Hub Authentication

```bash
echo "$DOCKER_TOKEN" | run_docker login -u "$DOCKER_USERNAME" --password-stdin
```

**מה קורה?**

- מתחבר ל-Docker Hub עם credentials שהועברו מ-GitHub Actions
- `DOCKER_TOKEN` ו-`DOCKER_USERNAME` מגיעים מה-GitHub Secrets
- `run_docker` - פונקציה עזר שבודקת אם צריך `sudo`

#### 3. Pull Images

```bash
run_docker pull "$DOCKER_USERNAME/shopping-list-api:latest" || echo "⚠️  Failed to pull API image"
run_docker pull "$DOCKER_USERNAME/shopping-list-client:latest" || echo "⚠️  Failed to pull client image"
```

**מה קורה?**

- מושך את התמונות העדכניות ביותר מ-Docker Hub
- אם ה-Pull נכשל, ממשיך (יכול להיות שיש תמונה מקומית)

#### 4. יצירת תיקיות

```bash
mkdir -p ~/shopping-list-app
cd ~/shopping-list-app
```

יוצר תיקיית עבודה לפרויקט.

#### 5. יצירת קובץ .env

```bash
cat > .env << EOF
PORT=3000
NODE_ENV=production
MONGO_URI=mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/${MONGO_DATABASE}?authSource=admin
# ... כל ה-variables האחרים
EOF
```

**מה קורה?**

- יוצר קובץ `.env` עם כל ה-configuration
- משתמש ב-values מה-GitHub Secrets
- `MONGO_URI` נבנה דינמית מפירוט ה-credentials

**Variables ב-.env:**

- `PORT` - פורט השרת (3000)
- `NODE_ENV` - production
- `MONGO_URI` - connection string למסד הנתונים
- `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD` - MongoDB credentials
- `JWT_SECRET`, `JWT_EXPIRE` - JWT configuration
- `MONGO_EXPRESS_USERNAME`, `MONGO_EXPRESS_PASSWORD` - Mongo Express credentials
- `UPLOAD_PATH`, `MAX_FILE_SIZE` - File upload settings

#### 6. יצירת nginx.conf

```bash
cat > nginx.conf << 'NGINX_EOF'
events {
    worker_connections 1024;
}
http {
    upstream node_backend {
        server api1:3000;
        server api2:3000;
        server api3:3000;
    }
    # ... תצורת routing
}
NGINX_EOF
```

**מה קורה?**

- יוצר קובץ תצורת Nginx עם Load Balancing
- `upstream node_backend` - מגדיר את 3 ה-API instances
- Routing rules:
  - `/api/health` - Health check endpoint
  - `/api/*` - כל ה-API requests → Load Balanced בין 3 instances
  - `/uploads/*` - קבצים מועלים → Backend
  - `/` - כל השאר → Client container

**Load Balancing:**
Nginx מחלק את העומס בין 3 ה-API instances ב-Round-Robin (ברצף).

#### 7. יצירת docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: "3.9"
services:
  api1:
    image: ${DOCKER_USERNAME}/shopping-list-api:latest
    # ... תצורה מלאה
  api2:
    # ... זהה ל-api1
  api3:
    # ... זהה ל-api1
  client:
    image: ${DOCKER_USERNAME}/shopping-list-client:latest
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
  mongodb:
    image: mongo:7.0
  mongo-express:
    image: mongo-express:1.0.2
    ports:
      - "8081:8081"
EOF
```

**מה קורה?**

- יוצר `docker-compose.yml` מלא עם כל השירותים
- כל שירות מוגדר עם:
  - `image` - תמונת Docker (מ-Docker Hub)
  - `restart: unless-stopped` - restart אוטומטי
  - `networks` - רשת משותפת
  - `depends_on` - תלויות בין שירותים
  - `volumes` - טיפול בקבצים (uploads, mongodb_data)

**שירותים:**

1. **api1, api2, api3** - 3 instances זהים של ה-API
2. **client** - Frontend container
3. **nginx** - Load balancer ו-reverse proxy (פורט 80)
4. **mongodb** - מסד הנתונים עם volume persist
5. **mongo-express** - ממשק ניהול (פורט 8081)

#### 8. הפעלת השירותים

```bash
# Export DOCKER_USERNAME עבור docker-compose
export DOCKER_USERNAME

# עצור containers קיימים
docker_compose down || true

# הפעל containers חדשים
docker_compose up -d
```

**מה קורה?**

- `docker_compose down` - עוצר ומסיר containers ישנים (אם יש)
- `docker_compose up -d` - מפעיל את כל השירותים ב-detached mode
- הפונקציה `docker_compose()` תומכת ב-v1 ו-v2 של Docker Compose

#### 9. בדיקה ואימות

```bash
sleep 10  # מחכה שהשירותים יתחילו
docker_compose ps      # מציג סטטוס
docker_compose logs --tail=50  # מציג logs אחרונים
```

**מה קורה?**

- ממתין 10 שניות לשירותים להתחיל
- מציג את סטטוס כל ה-containers
- מציג את ה-logs האחרונים לאימות שהכל עובד

---

## 🐳 מבנה Docker

### Server Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

RUN mkdir -p uploads

EXPOSE 3000

CMD ["npm", "start"]
```

**מה קורה כאן?**

- בסיס: `node:20-alpine` (קל ומהיר)
- `WORKDIR` - מגדיר תיקיית עבודה
- `COPY package*.json` - מעתיק קבצי dependencies
- `npm ci --omit=dev` - מתקין רק production dependencies (מהיר יותר)
- `COPY . .` - מעתיק את כל הקוד
- `mkdir -p uploads` - יוצר תיקיית uploads
- `EXPOSE 3000` - חושף את פורט 3000
- `CMD` - מפעיל את השרת

### Client Dockerfile

```dockerfile
FROM nginx:alpine

COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**מה קורה כאן?**

- בסיס: `nginx:alpine` (שרת ווב קל)
- מעתיק את כל קבצי ה-Frontend לתיקיית ה-HTML של Nginx
- מעתיק את תצורת Nginx
- `daemon off` - מפעיל Nginx ב-foreground

### Docker Compose Structure

הקובץ `docker-compose.yml` מגדיר את כל השירותים כ-network אחד:

```yaml
networks:
  shopping-list-network:
    driver: bridge
```

כל ה-containers יכולים לתקשר זה עם זה בשמותיהם:

- `api1`, `api2`, `api3` - API instances
- `client` - Frontend
- `mongodb` - Database
- `nginx` - Load Balancer

**Volumes:**

```yaml
volumes:
  mongodb_data:  # Persistent storage למסד הנתונים
  ./uploads:/usr/src/app/uploads  # Shared uploads בין API instances
```

---

## ⚙️ תצורת Nginx - Load Balancing

תצורת Nginx נמצאת בקובץ `nginx.conf` שנוצר על ידי `deploy.sh`.

### Upstream Configuration

```nginx
upstream node_backend {
    server api1:3000;
    server api2:3000;
    server api3:3000;
}
```

מגדיר קבוצת שרתים - Nginx יחלק בקשות בין 3 ה-API instances.

### Routing Rules

1. **Health Check**

   ```nginx
   location /api/health {
       proxy_pass http://node_backend;
       proxy_connect_timeout 5s;
       proxy_read_timeout 5s;
   }
   ```

   - בדיקת בריאות מהירה (timeout קצר)

2. **API Routes**

   ```nginx
   location /api {
       proxy_pass http://node_backend;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
   }
   ```

   - כל ה-API requests → Load Balanced בין 3 instances
   - Headers להעברת מידע על המבקש המקורי

3. **Static Files (Uploads)**

   ```nginx
   location /uploads {
       proxy_pass http://node_backend;
   }
   ```

   - קבצים מועלים → אחד מ-API instances (כולם מחוברים לאותו volume)

4. **Frontend**
   ```nginx
   location / {
       proxy_pass http://client:80/;
   }
   ```

   - כל השאר → Client container

**Load Balancing Strategy:**
Round-Robin (ברירת מחדל) - כל בקשה הולכת לשרת הבא ברשימה.

---

## 🔐 GitHub Secrets הנדרשים

כדי שה-Pipeline יעבוד, צריך להגדיר את ה-Secrets הבאים ב-GitHub Repository:

### Docker Hub

- `DOCKER_USERNAME` - שם המשתמש ב-Docker Hub
- `DOCKER_TOKEN` - Access Token ל-Docker Hub (לא סיסמה!)

### EC2

- `EC2_SSH_KEY` - Private key ל-SSH (תוכן קובץ `.pem`)
- `EC2_HOST` - כתובת IP או hostname של שרת EC2
- `EC2_USER` - שם המשתמש ב-EC2 (בדרך כלל `ubuntu` או `ec2-user`)

### MongoDB

- `MONGO_ROOT_USERNAME` - שם משתמש למסד הנתונים (default: `admin`)
- `MONGO_ROOT_PASSWORD` - סיסמה למסד הנתונים
- `MONGO_DATABASE` - שם מסד הנתונים (default: `shopping_list_db`)

### JWT

- `JWT_SECRET` - מפתח סודי להצפנת JWT tokens (חשוב! לשמור בסוד)
- `JWT_EXPIRE` - משך תוקף tokens (default: `7d`)

### Mongo Express

- `MONGO_EXPRESS_USERNAME` - שם משתמש ל-Mongo Express UI
- `MONGO_EXPRESS_PASSWORD` - סיסמה ל-Mongo Express UI

### File Upload

- `UPLOAD_PATH` - נתיב לתיקיית העלאות (default: `./uploads`)
- `MAX_FILE_SIZE` - גודל מקסימלי של קבצים בבתים (default: `5242880` = 5MB)

### Email Notifications (אופציונלי)

- `EMAIL_USERNAME` - שם משתמש ל-SMTP (להתראות)
- `EMAIL_PASSWORD` - סיסמה ל-SMTP
- `EMAIL_TO` - כתובת אימייל למשלוח התראות
- `EMAIL_FROM` - כתובת אימייל שולח

**איך להוסיף Secrets?**

1. עבור ל-Repository ב-GitHub
2. Settings → Secrets and variables → Actions
3. New repository secret
4. הוסף כל secret בנפרד

---

## 💻 הפעלה מקומית

להפעלה מקומית לבדיקות ופיתוח:

### דרישות מוקדמות

- Docker Desktop (או Docker Engine + Docker Compose)
- Git

### הוראות

1. **Clone Repository**

   ```bash
   git clone <repository-url>
   cd devops-project-chen
   ```

2. **צור קובץ .env**

   ```bash
   cd server
   cp env_example.txt .env
   ```

   ערוך את `.env`:

   ```env
   PORT=3000
   NODE_ENV=development
   MONGO_URI=mongodb://admin:password123@mongodb:27017/shopping_list_db?authSource=admin
   MONGO_DATABASE=shopping_list_db
   MONGO_ROOT_USERNAME=admin
   MONGO_ROOT_PASSWORD=password123
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   MONGO_EXPRESS_USERNAME=admin
   MONGO_EXPRESS_PASSWORD=admin123
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   ```

3. **הפעל עם Docker Compose**

   ```bash
   cd ..
   docker-compose up
   ```

4. **פתח בדפדפן**
   - Frontend: http://localhost
   - Mongo Express: http://localhost:8081
   - MongoDB: localhost:27018 (אם צריך גישה ישירה)

### עצירת השירותים

```bash
docker-compose down
```

למחיקת כל ה-volumes:

```bash
docker-compose down -v
```

---

## 🧪 בדיקות (Testing)

### מבנה הבדיקות

הבדיקות ממוקמות ב-`server/tests/`:

```
server/tests/
├── controllers/
│   ├── authController.test.js
│   └── shoppingListController.test.js
├── middleware/
│   └── auth.test.js
├── models/
│   ├── ShoppingList.test.js
│   └── User.test.js
└── setup.js
```

### הרצת בדיקות מקומית

```bash
cd server
npm install
npm test          # עם coverage
npm run test:watch  # watch mode
npm run test:ci    # CI mode (כמו ב-GitHub Actions)
```

### מה נבדק?

- **Models** - validation, schema, methods
- **Controllers** - CRUD operations, error handling
- **Middleware** - authentication, authorization
- **Integration** - end-to-end API flows

הבדיקות משתמשות ב-`mongodb-memory-server` - מסד נתונים זמני בזיכרון (לא צריך MongoDB פועל).

---

## 📊 Monitoring ו-Logging

### Logs

לצפייה ב-logs של כל השירותים:

**במקומי:**

```bash
docker-compose logs -f
```

**בפריסה (EC2):**

```bash
ssh user@ec2-host
cd ~/shopping-list-app
docker-compose logs -f
```

### Health Check

בדיקת בריאות המערכת:

```bash
curl http://localhost/api/health
```

תגובה:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Mongo Express

לצפייה במסד הנתונים:

- URL: `http://localhost:8081` (או `http://EC2_HOST:8081` בפריסה)
- התחבר עם `MONGO_EXPRESS_USERNAME` ו-`MONGO_EXPRESS_PASSWORD`

---

## 🔄 תהליך פיתוח מלא - סיכום

### 1. פיתוח מקומי

```bash
# ערוך קוד
# הרץ בדיקות מקומית
npm test

# הפעל עם docker-compose
docker-compose up
```

### 2. Commit ו-Push

```bash
git add .
git commit -m "Feature: ..."
git push origin develop
```

### 3. CI/CD Pipeline (אוטומטי)

**על Push ל-`develop`:**

1. ✅ Tests רץ (Node.js 18.x, 20.x)
2. ✅ Build & Push - תמונות Docker ל-Hub עם תג `develop`

**על Push ל-`main`:**

1. ✅ Tests רץ
2. ✅ Build & Push - תמונות עם תג `latest`
3. ✅ Deploy - פריסה אוטומטית ל-EC2

### 4. פריסה על EC2 (אוטומטי)

`deploy.sh` מבצע:

1. ✅ בדיקת/התקנת Docker
2. ✅ Login ל-Docker Hub
3. ✅ Pull תמונות חדשות
4. ✅ יצירת קבצי תצורה (.env, nginx.conf, docker-compose.yml)
5. ✅ הפעלת השירותים

### 5. אימות

- האפליקציה זמינה ב-`http://EC2_HOST`
- Mongo Express ב-`http://EC2_HOST:8081`
- Health check: `http://EC2_HOST/api/health`

---

## 🎯 סיכום - נקודות מפתח DevOps

### CI/CD Pipeline

- ✅ בדיקות אוטומטיות על כל Push/PR
- ✅ Matrix testing על מספר גרסאות Node.js
- ✅ Build ו-Push אוטומטי ל-Docker Hub
- ✅ Cache strategy להאצת builds
- ✅ פריסה אוטומטית רק ל-main/master
- ✅ התראות על כשלים

### Infrastructure

- ✅ Load Balancing בין 3 API instances
- ✅ Reverse Proxy עם Nginx
- ✅ Persistent storage למסד הנתונים
- ✅ Shared volumes לקבצים מועלים
- ✅ Health checks מובנים

### Security

- ✅ Secrets management עם GitHub Secrets
- ✅ JWT authentication
- ✅ MongoDB authentication
- ✅ SSH keys מאובטחים לפריסה

### Scalability

- ✅ 3 API instances עם Load Balancing
- ✅ קל להוסיף עוד instances (רק להוסיף ל-nginx.conf)
- ✅ Stateless API - כל instance עצמאי
- ✅ Shared database - consistency מובטחת

---

## 📝 הערות נוספות

- **Rollback:** כדי לחזור לגרסה קודמת, ניתן למשוך תמונה עם תג ספציפי מ-Docker Hub
- **Zero-Downtime Deployment:** `docker-compose up -d` מבצע rolling update אם כבר רץ
- **Logs Retention:** Nginx logs נשמרים ב-containers (ניתן להוסיף volume ל-persistence)
- **Backup:** מומלץ לגבות את `mongodb_data` volume באופן קבוע

---

## 📞 תמיכה

לשאלות או בעיות, פתח Issue ב-GitHub Repository.

---

**נבנה עם ❤️ באמצעות DevOps best practices**
