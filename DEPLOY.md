# تشغيل النظام من الجوال كـ PWA

النظام الآن يستخدم قاعدة بيانات أونلاين:

Turso

ولذلك يمكن تشغيله على رابط ثابت بدون فتح اللابتوب.

## المتغيرات المطلوبة

ضع هذه المتغيرات في الاستضافة:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
```

لا ترفع ملف:

```text
.env.local
```

لأنه يحتوي بيانات اتصال سرية.

## النشر على Vercel

1. ارفع المشروع إلى GitHub.
2. اربط المشروع في:

Vercel

3. أضف المتغيرات السابقة في:

Project Settings -> Environment Variables

4. نفذ:

```bash
npm run build
```

أو اترك Vercel ينفذها تلقائيًا.

5. بعد النشر افتح الرابط من الجوال واحفظه على الشاشة الرئيسية.

## نقل البيانات الحالية إلى Turso

تم تجهيز سكربت النقل:

```bash
npm run db:migrate:turso
```

هذا السكربت يقرأ من:

```text
database.sqlite
```

وينقل الجداول إلى قاعدة:

Turso

## Docker اختياري

لو أردت تشغيله على سيرفر:

VPS

استخدم:

```bash
docker compose up -d --build
```

مع وضع:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
```

في ملف بيئة على السيرفر.
