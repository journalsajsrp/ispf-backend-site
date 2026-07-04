const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// إعدادات السيرفر
app.use(express.json());
app.use(express.static('public'));

// 1. الاتصال بقاعدة البيانات
// ملاحظة: Render سيستخدم الرابط الموجود في Environment Variables تلقائياً
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://test:123456@cluster0.sbcz5yb.mongodb.net/?appName=Cluster0';
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

// 4. مسار تحديث الإعلان (بكلمة مرور 123456)
app.post('/api/update-announcement', async (req, res) => {
    const { newText, password } = req.body;
    
// استبدل السطر القديم بهذا السطر الجديد:
if (password !== 'ispf2026') {
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
