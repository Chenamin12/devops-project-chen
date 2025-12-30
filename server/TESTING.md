# מדריך הרצת בדיקות

מדריך זה מסביר כיצד להריץ את בדיקות Jest באופן ידני על המחשב המקומי וכיצד הן רצות אוטומטית ב-GitHub Actions.

## תוכן עניינים

1. [התקנת תלויות](#התקנת-תלויות)
2. [הרצת בדיקות ידנית](#הרצת-בדיקות-ידנית)
3. [בדיקות ב-GitHub Actions](#בדיקות-ב-github-actions)
4. [מבנה הבדיקות](#מבנה-הבדיקות)

## התקנת תלויות

לפני הרצת הבדיקות, יש להתקין את כל התלויות:

```bash
cd server
npm install
```

זה יתקין את כל התלויות הנדרשות כולל:
- `jest` - מסגרת הבדיקות
- `supertest` - לבדיקות API
- `mongodb-memory-server` - מסד נתונים זמני לבדיקות

## הרצת בדיקות ידנית

### הרצת כל הבדיקות

להרצת כל הבדיקות עם דוח כיסוי:

```bash
cd server
npm test
```

פקודה זו:
- מריצה את כל הבדיקות
- מייצרת דוח כיסוי קוד (coverage report)
- מציגה סיכום של הבדיקות

### הרצת בדיקות במצב watch

להרצת בדיקות במצב watch (הבדיקות רצות מחדש אוטומטית כשמשנים קבצים):

```bash
cd server
npm run test:watch
```

זה שימושי במהלך פיתוח, כי הבדיקות רצות מחדש אוטומטית כשמשנים קוד.

### הרצת בדיקה ספציפית

להרצת בדיקה של קובץ ספציפי:

```bash
cd server
npx jest tests/controllers/authController.test.js
```

או עם watch:

```bash
cd server
npx jest tests/controllers/authController.test.js --watch
```

### הרצת בדיקות לפי תבנית

להרצת בדיקות לפי תבנית בשם:

```bash
cd server
npx jest --testNamePattern="should register a new user"
```

### צפייה בדוח כיסוי

לאחר הרצת `npm test`, דוח הכיסוי נמצא בתיקייה `server/coverage/`.

לצפייה בדוח HTML:

```bash
cd server
# ב-Windows
start coverage/index.html

# ב-Mac
open coverage/index.html

# ב-Linux
xdg-open coverage/index.html
```

## בדיקות ב-GitHub Actions

הבדיקות רצות אוטומטית ב-GitHub Actions בכל push או pull request.

### מתי הבדיקות רצות?

הבדיקות רצות אוטומטית כאשר:
- דוחפים קוד לענפים: `main`, `master`, או `develop`
- יוצרים Pull Request לענפים: `main`, `master`, או `develop`

### איך לראות את התוצאות?

1. לך ל-GitHub repository שלך
2. לחץ על הטאב **"Actions"** בראש העמוד
3. תראה רשימה של כל הרצות הבדיקות
4. לחץ על הרצה ספציפית כדי לראות פרטים

### מה הבדיקות עושות ב-GitHub Actions?

1. **Checkout code** - מוריד את הקוד מהרפוזיטורי
2. **Setup Node.js** - מתקין Node.js בגרסאות 18.x ו-20.x (בדיקות במטריצה)
3. **Install dependencies** - מתקין את כל התלויות עם `npm ci`
4. **Run tests** - מריץ את הבדיקות עם `npm run test:ci`
5. **Upload coverage** - מעלה דוח כיסוי (רק בגרסה 20.x)

### מה קורה אם בדיקה נכשלת?

אם בדיקה נכשלת:
- ה-Action יסומן כנכשל (אדום)
- תראה הודעה ב-GitHub
- תוכל לראות את הלוגים כדי להבין מה השתבש

### הרצת בדיקות מקומית כמו ב-GitHub Actions

להרצת בדיקות באותו אופן כמו ב-GitHub Actions:

```bash
cd server
npm run test:ci
```

פקודה זו:
- מריצה בדיקות במצב CI (לא interactive)
- מייצרת דוח כיסוי
- משתמשת ב-2 workers בלבד (כמו ב-GitHub Actions)

## מבנה הבדיקות

הבדיקות מאורגנות בתיקייה `server/tests/`:

```
server/tests/
├── setup.js                          # הגדרות כלליות לבדיקות
├── controllers/
│   ├── authController.test.js        # בדיקות ל-auth controller
│   └── shoppingListController.test.js # בדיקות ל-shopping list controller
├── middleware/
│   └── auth.test.js                  # בדיקות ל-auth middleware
└── models/
    ├── User.test.js                  # בדיקות למודל User
    └── ShoppingList.test.js          # בדיקות למודל ShoppingList
```

### סוגי הבדיקות

#### 1. בדיקות Controllers
בודקות את הלוגיקה של ה-API endpoints:
- רישום והתחברות משתמשים
- CRUD operations על רשימות קניות
- ניהול מוצרים ברשימות

#### 2. בדיקות Middleware
בודקות את middleware האימות:
- בדיקת טוקנים תקינים
- דחיית טוקנים לא תקינים
- הגנה על routes

#### 3. בדיקות Models
בודקות את המודלים של MongoDB:
- יצירת משתמשים ורשימות
- ולידציה של שדות
- פונקציות מובנות (כמו hash של סיסמאות)

### שימוש ב-MongoDB Memory Server

הבדיקות משתמשות ב-`mongodb-memory-server` כדי ליצור מסד נתונים זמני בזיכרון.
זה אומר:
- אין צורך בהתקנת MongoDB מקומי
- הבדיקות מהירות יותר
- כל הרצת בדיקות מתחילה עם מסד נתונים נקי
- אין צורך בניקוי ידני של מסד הנתונים

### משתני סביבה לבדיקות

הבדיקות משתמשות במשתני סביבה מוגדרים ב-`tests/setup.js`:
- `JWT_SECRET` - מפתח להצפנת JWT tokens
- `JWT_EXPIRE` - זמן תפוגה של tokens
- `UPLOAD_PATH` - נתיב לשמירת קבצים
- `MAX_FILE_SIZE` - גודל מקסימלי של קבצים

## טיפים

1. **הרץ בדיקות לפני commit** - זה יעזור לך לתפוס באגים מוקדם
2. **השתמש ב-watch mode** - זה חוסך זמן במהלך פיתוח
3. **בדוק את דוח הכיסוי** - ודא שהקוד שלך מכוסה בבדיקות
4. **קרא את הודעות השגיאה** - Jest נותן הודעות שגיאה ברורות

## פתרון בעיות

### הבדיקות לא רצות

1. ודא שהתקנת את כל התלויות: `npm install`
2. ודא שאתה בתיקייה `server`
3. בדוק שיש לך Node.js מותקן (גרסה 18 או 20)

### שגיאות חיבור למסד נתונים

הבדיקות משתמשות ב-MongoDB Memory Server, אז לא אמור להיות צורך במסד נתונים חיצוני.
אם יש שגיאות, נסה:
1. מחק את `node_modules` והתקן מחדש: `rm -rf node_modules && npm install`
2. ודא שהתלויות מעודכנות

### בדיקות נכשלות ב-GitHub Actions אבל עובדות מקומית

1. ודא שאתה מריץ `npm run test:ci` מקומית
2. בדוק את הלוגים ב-GitHub Actions לראות מה השתבש
3. ודא שכל הקבצים נדחפו ל-GitHub

## סיכום

הבדיקות מספקות ביטחון שהקוד עובד כצפוי. הן רצות אוטומטית ב-GitHub Actions, אבל חשוב להריץ אותן גם מקומית לפני commit.

לשאלות או בעיות, בדוק את הלוגים או את קבצי הבדיקות עצמם.

