const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// إعدادات السيرفر
app.use(express.json());
app.use(express.static('public')); // ليتمكن الموقع من قراءة ملفاتك الثابتة

// 1. الاتصال بقاعدة البيانات (ضع رابط MongoDB الخاص بك هنا)
const mongoURI = process.env.MONGODB_URI || 'YOUR_MONGODB_CONNECTION_STRING';
mongoose.connect(mongoURI).then(() => console.log('Connected to MongoDB'));

// 2. نموذج الإعلان (لجلب وتحديث الإعلان من لوحة التحكم)
const announcementSchema = new mongoose.Schema({ text: String });
const Announcement = mongoose.model('Announcement', announcementSchema);

// 3. مسار جلب البيانات (يستخدمه ملف index.html لجلب الإعلانات والملفات)
app.get('/api/data', async (req, res) => {
    try {
        const announcement = await Announcement.findOne() || { text: "مرحباً بكم في المؤسسة الدولية للنشر العلمي" };
        res.json({ announcement: announcement.text, files: [] }); // أضف منطق جلب الملفات هنا
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. مسار تحديث الإعلان (هذا هو المسار الذي أعطاك رسالة Unauthorized)
// أضف شرط تحقق بسيط هنا للسماح لك بالتعديل
app.post('/api/update-announcement', async (req, res) => {
    const { newText, password } = req.body;
    // تحقق من كلمة مرور بسيطة لتجاوز الـ Unauthorized
    if (password !== '123456') return res.status(401).send('Unauthorized');
    
    await Announcement.findOneAndUpdate({}, { text: newText }, { upsert: true });
    res.send('تم تحديث الإعلان بنجاح!');
});

// 5. تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
