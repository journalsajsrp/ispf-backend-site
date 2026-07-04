const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// إعدادات السيرفر
app.use(express.json());
app.use(express.static('public'));

// 1. الاتصال بقاعدة البيانات
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://test:123456@cluster0.sboz5yb.mongodb.net/ispf_database?retryWrites=true&w=majority';

mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB successfully!'))
    .catch((err) => console.error('Could not connect to MongoDB:', err));

// 2. نموذج الإعلان
const announcementSchema = new mongoose.Schema({ text: String });
const Announcement = mongoose.model('Announcement', announcementSchema);

// 3. مسار جلب البيانات للموقع
app.get('/api/data', async (req, res) => {
    try {
        const announcement = await Announcement.findOne() || { text: "بدء استقبال الأبحاث والأوراق العلمية للنشر في المجلات المدرجة Scopus لعام 2026م." };
        res.json({ announcement: announcement.text, files: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. مسار تحديث الإعلان (تم التعديل ليقرأ من لوحة تحكم Render أو الكلمة الافتراضية)
app.post('/api/update-announcement', async (req, res) => {
    const { newText, password } = req.body;
    
    // يقرأ القيمة المكتوبة في Render (ADMIN_PASSWORD) وإذا لم يجدها يستخدم 'ispf2026' كاحتياط
    const validPassword = process.env.ADMIN_PASSWORD || 'ispf2026';
    
    if (password !== validPassword) {
        return res.status(401).send('غير مصرح لك بالدخول (Unauthorized)');
    }
    
    try {
        await Announcement.findOneAndUpdate({}, { text: newText }, { upsert: true });
        res.send('تم تحديث الإعلان بنجاح في قاعدة البيانات!');
    } catch (err) {
        res.status(500).send('حدث خطأ أثناء التحديث');
    }
});

// 5. تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
