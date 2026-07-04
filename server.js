const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// 1. رابط قاعدة البيانات المباشر
const mongoURI = 'mongodb+srv://test:123456@cluster0.sboz5yb.mongodb.net/ispf_database?retryWrites=true&w=majority';

// تعطيل الـ Buffering إجبارياً لمنع السيرفر من التعليق والانتظار دون فائدة
mongoose.set('bufferCommands', false);

// الاتصال المباشر بقاعدة البيانات
mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000 // قطع المحاولة فوراً بعد 5 ثوانٍ وإظهار المشكلة
})
.then(() => console.log('✅ Connected to MongoDB successfully!'))
.catch((err) => console.error('❌ Could not connect to MongoDB:', err));

// 2. النماذج (Schemas) مع تعطيل الـ Buffer لكل نموذج على حدة
const announcementSchema = new mongoose.Schema({ text: String }, { bufferCommands: false });
const Announcement = mongoose.model('Announcement', announcementSchema);

const fileSchema = new mongoose.Schema({
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { bufferCommands: false });
const JournalFile = mongoose.model('JournalFile', fileSchema);

// 3. مسار جلب البيانات للموقع
app.get('/api/data', async (req, res) => {
    try {
        const announcement = await Announcement.findOne() || { text: "بدء استقبال الأبحاث والأوراق العلمية للنشر في المجلات المدرجة Scopus لعام 2026م." };
        const files = await JournalFile.find().sort({ createdAt: -1 });
        res.json({ announcement: announcement.text, files: files });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. مسار التحديث المحمي (للمدير فقط)
app.post('/api/update-announcement', async (req, res) => {
    const { newText, password, fileTitle, fileUrl } = req.body;
    
    // استخدام كلمة المرور الصارمة
    const validPassword = process.env.ADMIN_PASSWORD || 'ispf2026';
    
    if (password !== validPassword) {
        return res.status(401).send('خطأ: غير مصرح لك بالتعديل، كلمة المرور غير صحيحة!');
    }
    
    try {
        if (newText) {
            await Announcement.findOneAndUpdate({}, { text: newText }, { upsert: true });
        }
        if (fileTitle && fileUrl) {
            const newJournal = new JournalFile({ title: fileTitle, fileUrl: fileUrl });
            await newJournal.save();
        }
        res.send('تم تحديث البيانات بنجاح في قاعدة البيانات السحابية!');
    } catch (err) {
        // إرجاع تفاصيل الخطأ الحقيقية للمتصفح مباشرة
        res.status(500).send('حدث خطأ أثناء التحديث: ' + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
