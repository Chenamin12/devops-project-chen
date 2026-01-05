# מדריך פריסה ל-EC2 - AWS Free Tier

## שלב 1: יצירת חשבון AWS

### 1.1 הרשמה ל-AWS
1. היכנס ל-https://aws.amazon.com
2. לחץ על "Create an AWS Account"
3. מלא את הפרטים:
   - כתובת אימייל
   - שם משתמש
   - סיסמה חזקה
   - מספר טלפון (לצורך אימות)
4. הזן פרטי כרטיס אשראי (לא יגבה כסף במסלול החינמי)
5. אמת את הטלפון שלך
6. בחר תוכנית תמיכה (בחר "Basic" - חינמי)

### 1.2 התחברות ל-AWS Console
1. היכנס ל-https://console.aws.amazon.com
2. התחבר עם הפרטים שיצרת

---

## שלב 2: יצירת EC2 Instance

### 2.1 יצירת Key Pair (SSH Key)
1. ב-AWS Console, חפש "EC2" בשורת החיפוש
2. לחץ על "EC2" → "Key Pairs" בתפריט השמאלי
3. לחץ על "Create key pair"
4. הגדר:
   - **Name**: `shopping-list-ec2-key` (או שם אחר)
   - **Key pair type**: RSA
   - **Private key file format**: `.pem` (ל-Linux/Mac) או `.ppk` (ל-PuTTY ב-Windows)
5. לחץ "Create key pair"
6. **שמור את הקובץ במקום בטוח!** - תצטרך אותו להתחברות

### 2.2 יצירת Security Group
1. ב-EC2 Console, לחץ על "Security Groups" בתפריט השמאלי
2. לחץ על "Create security group"
3. הגדר:
   - **Name**: `shopping-list-sg`
   - **Description**: `Security group for shopping list app`
4. **Inbound rules** (כללי כניסה):
   - **Type**: SSH, **Port**: 22, **Source**: My IP (או 0.0.0.0/0 אם אתה בטוח)
   - **Type**: HTTP, **Port**: 80, **Source**: 0.0.0.0/0
   - **Type**: HTTPS, **Port**: 443, **Source**: 0.0.0.0/0 (אופציונלי)
   - **Type**: Custom TCP, **Port**: 27018, **Source**: My IP (למנואל MongoDB access)
5. **Outbound rules**: השאר ברירת מחדל (All traffic)
6. לחץ "Create security group"

### 2.3 יצירת EC2 Instance
1. ב-EC2 Console, לחץ על "Instances" בתפריט השמאלי
2. לחץ על "Launch instance"
3. **Name**: `shopping-list-app`
4. **AMI (Amazon Machine Image)**: בחר "Ubuntu Server 22.04 LTS" (Free Tier eligible)
5. **Instance type**: בחר `t2.micro` (Free Tier eligible)
6. **Key pair**: בחר את ה-key pair שיצרת (`shopping-list-ec2-key`)
7. **Network settings**:
   - **VPC**: השאר ברירת מחדל
   - **Subnet**: השאר ברירת מחדל
   - **Auto-assign Public IP**: Enable
   - **Security group**: בחר את `shopping-list-sg` שיצרת
8. **Configure storage**: 8 GB gp3 (Free Tier כולל 30 GB)
9. לחץ "Launch instance"
10. **שמור את ה-Public IP Address** - תצטרך אותו!

---

## שלב 3: הגדרת GitHub Secrets

### 3.1 קבלת ה-Public IP
1. ב-EC2 Console → Instances
2. בחר את ה-instance שיצרת
3. העתק את ה-**Public IPv4 address**

### 3.2 הוספת Secrets ב-GitHub
1. בפרויקט ב-GitHub: **Settings** → **Secrets and variables** → **Actions**
2. לחץ על **"New repository secret"**
3. הוסף את ה-secrets הבאים:

#### `EC2_HOST`
- **Name**: `EC2_HOST`
- **Value**: ה-Public IP Address של ה-EC2 instance (למשל: `54.123.45.67`)

#### `EC2_USER`
- **Name**: `EC2_USER`
- **Value**: `ubuntu` (ל-Ubuntu AMI)

#### `EC2_SSH_KEY`
- **Name**: `EC2_SSH_KEY`
- **Value**: תוכן הקובץ `.pem` שיצרת (פתח את הקובץ בעורך טקסט והעתק את כל התוכן כולל `-----BEGIN RSA PRIVATE KEY-----` ו-`-----END RSA PRIVATE KEY-----`)

#### `EC2_DOCKER_USERNAME` (אופציונלי)
- **Name**: `EC2_DOCKER_USERNAME`
- **Value**: אותו `DOCKER_USERNAME` שכבר יש לך (מה-Docker Hub)
- **הערה**: זה לא נדרש אם `DOCKER_USERNAME` כבר קיים ב-secrets

---

## שלב 4: התחברות ראשונית ל-EC2 (בדיקה)

### 4.1 Windows (PowerShell)
```powershell
# שנה את הנתיב לקובץ ה-.pem שלך
ssh -i "C:\path\to\shopping-list-ec2-key.pem" ubuntu@<PUBLIC_IP>
```

### 4.2 Linux/Mac
```bash
# שנה את הנתיב לקובץ ה-.pem שלך
chmod 400 ~/shopping-list-ec2-key.pem
ssh -i ~/shopping-list-ec2-key.pem ubuntu@<PUBLIC_IP>
```

### 4.3 התקנת Docker ו-Docker Compose (אם התחברת בהצלחה)
```bash
# עדכן את המערכת
sudo apt update

# התקן Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# הוסף את המשתמש ubuntu לקבוצת docker
sudo usermod -aG docker ubuntu

# התקן Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# הפעל מחדש את ההתחברות (exit ואז ssh שוב)
exit
```

---

## שלב 5: מה ה-Workflow יעשה

כאשר תעשה push ל-main, ה-workflow:
1. יריץ tests
2. יבנה images ויעלה ל-Docker Hub
3. יתחבר ל-EC2 דרך SSH
4. יוריד את ה-images החדשים מ-Docker Hub
5. יעדכן את ה-docker-compose.yml עם ה-images החדשים
6. יפרוס את האפליקציה מחדש

---

## שלב 6: גישה לאפליקציה

לאחר הפריסה, האפליקציה תהיה זמינה ב:
- `http://<PUBLIC_IP>` - האפליקציה הראשית
- `http://<PUBLIC_IP>:8081` - Mongo Express (אם מופעל)

---

## הערות חשובות

### Free Tier Limits:
- **750 שעות/חודש** של `t2.micro` instance
- **30 GB** אחסון EBS
- **2 מיליון I/O requests**

### עלויות:
- אם תכבה את ה-instance כשהוא לא בשימוש, לא תיגבה עלות
- אם ה-instance רץ 24/7, זה עדיין בתוך ה-Free Tier (750 שעות = 31 יום)

### אבטחה:
- **אל תשתף את ה-SSH key שלך!**
- **שנה את הסיסמאות** של MongoDB ב-production
- **השתמש ב-SSL/HTTPS** ב-production (דורש domain name)

---

## פתרון בעיות

### לא מצליח להתחבר ב-SSH:
- ודא שה-Security Group מאפשר SSH מה-IP שלך
- ודא שה-instance רץ (Status: running)
- ודא שהשתמשת ב-`.pem` file הנכון

### האפליקציה לא נגישה:
- ודא שה-Security Group מאפשר HTTP (port 80)
- בדוק את ה-logs: `docker-compose logs` ב-EC2

### Deployment נכשל:
- בדוק את ה-logs ב-GitHub Actions
- ודא שה-secrets מוגדרים נכון
- ודא ש-Docker מותקן ב-EC2

