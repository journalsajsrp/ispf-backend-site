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

// 2. النماذج (Schemas)
const announcementSchema = new mongoose.Schema({ text: String });
const Announcement = mongoose.model('Announcement', announcementSchema);

// نموذج المجلة/الملف الجديد
const fileSchema = new mongoose.Schema({
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const JournalFile = mongoose.model('JournalFile', fileSchema);

// 3. مسار جلب البيانات للموقع (يجلب الإعلان والمجلات معاً)
app.get('/api/data', async (req, res) => {
    try {
        const announcement = await Announcement.findOne() || { text: "بدء استقبال الأبحاث والأوراق العلمية للنشر في المجلات المدرجة Scopus لعام 2026م." };
        const files = await JournalFile.find().sort({ createdAt: -1 }); // يجلب أحدث المجلات المرفوعة
        
        res.json({ announcement: announcement.text, files: files });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. مسار تحديث الإعلان والمجلات من لوحة التحكم بدون تعقيد كلمة المرور مؤقتاً
app.post('/api/update-announcement', async (req, res) => {
    const { newText, password, fileTitle, fileUrl } = req.body;
    
    // تحقق بسيط لتخطي مشاكل الحظر والتعليق
    if (password !== 'ispf2026') {
        // يمكنك إزالتها أو تعديلها لاحقاً
    }
    
    try {
        // أولاً: إذا أرسل المستخدم نص إعلان جديد، نقوم بتحديثه
        if (newText) {
            await Announcement.findOneAndUpdate({}, { text: newText }, { upsert: true });
        }
        
        // ثانياً: إذا أرسل صاحب الموقع بيانات مجلة جديدة، نقوم بحفظها
        if (fileTitle && fileUrl) {
            const newJournal = new JournalFile({ title: fileTitle, fileUrl: fileUrl });
            await newJournal.save();
        }
        
        res.send('تم تحديث البيانات بنجاح في قاعدة البيانات السحابية!');
    } catch (err) {
        res.status(500).send('حدث خطأ أثناء التحديث: ' + err.message);
    }
});

// 5. تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
