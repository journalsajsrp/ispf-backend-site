const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const app = express();

// إعدادات قراءة البيانات
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'ispf_secret_key_2026',
    resave: false,
    saveUninitialized: true
}));

// إعدادات رفع الملفات وتخزينها مؤقتاً في السيرفر
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// 🔗 الاتصال بقاعدة البيانات السحابية الخاصة بك
const dbURI = 'mongodb+srv://test:Aa1020@@@cluster0.sbcz5yb.mongodb.net/?appName=Cluster0';
mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB Atlas Successfully!'))
  .catch(err => console.log('Database Connection Error:', err));

// هيكل البيانات للإعلانات والملفات
const Announcement = mongoose.model('Announcement', new mongoose.Schema({
    text: String,
    updatedAt: { type: Date, default: Date.now }
}));

const AcademicFile = mongoose.model('AcademicFile', new mongoose.Schema({
    title: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now }
}));

// المسارات (Routes)
app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// مسار جلب الإعلانات والملفات (لتقوم صفحة الـ HTML بقراءتها عبر Fetch API)
app.get('/api/data', async (req, res) => {
    const announcement = await Announcement.findOne().sort({ updatedAt: -1 });
    const files = await AcademicFile.find().sort({ uploadedAt: -1 });
    res.json({ announcement: announcement ? announcement.text : "لا توجد إعلانات اليوم", files });
});

app.get('/login', (req, res) => {
    res.send(`
        <div style="direction: rtl; text-align: center; margin-top: 100px; font-family: sans-serif;">
            <h2>🔐 تسجيل دخول لوحة تحكم الإدارة</h2>
            <form action="/login" method="POST" style="display: inline-block; background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
                <input type="text" name="username" placeholder="اسم المستخدم" required style="padding: 10px; margin: 10px; width: 250px;"><br>
                <input type="password" name="password" placeholder="كلمة المرور" required style="padding: 10px; margin: 10px; width: 250px;"><br>
                <button type="submit" style="background: #0284c7; color: white; border: none; padding: 10px 30px; cursor: pointer;">دخول</button>
            </form>
        </div>
    `);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'ispf2026') {
        req.session.isAdmin = true;
        return res.redirect('/admin');
    }
    res.send('<script>alert("البيانات خاطئة!"); window.location.href="/login";</script>');
});

app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    res.send(`
        <div style="direction: rtl; padding: 40px; font-family: sans-serif; max-width: 800px; margin: 0 auto;">
            <h1 style="color: #0284c7;">🎛️ لوحة تحكم الموقع الجديدة</h1>
            <hr>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3>📢 تحديث الإعلان اليومي المتحرك</h3>
                <form action="/admin/update-announcement" method="POST">
                    <textarea name="announcementText" style="width: 100%; height: 80px;" placeholder="اكتب الإعلان الجديد هنا..."></textarea><br>
                    <button type="submit" style="background: #0284c7; color: white; border: none; padding: 8px 20px; margin-top: 10px; cursor: pointer;">تحديث الإعلان</button>
                </form>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
                <h3>📚 رفع ملف جديد للمكتبة</h3>
                <form action="/admin/upload-file" method="POST" enctype="multipart/form-data">
                    <input type="text" name="fileTitle" placeholder="عنوان الملف" required style="width: 100%; padding: 10px; margin-bottom: 10px;"><br>
                    <input type="file" name="academicFile" required style="margin-bottom: 15px;"><br>
                    <button type="submit" style="background: #22c55e; color: white; border: none; padding: 8px 20px; cursor: pointer;">رفع الملف</button>
                </form>
            </div>
            <br><a href="/logout" style="color: #ef4444;">🚪 تسجيل الخروج</a>
        </div>
    `);
});

app.post('/admin/update-announcement', async (req, res) => {
    if (!req.session.isAdmin) return res.sendStatus(401);
    await new Announcement({ text: req.body.announcementText }).save();
    res.send('<script>alert("تم تحديث الإعلان!"); window.location.href="/admin";</script>');
});

app.post('/admin/upload-file', upload.single('academicFile'), async (req, res) => {
    if (!req.session.isAdmin) return res.sendStatus(401);
    const fileUrl = '/uploads/' + req.file.filename;
    await new AcademicFile({ title: req.body.fileTitle, fileUrl: fileUrl }).save();
    res.send('<script>alert("تم رفع الملف للمكتبة بنجاح!"); window.location.href="/admin";</script>');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
