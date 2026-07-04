const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// 1. الاتصال بقاعدة البيانات (تم وضع الرابط المباشر والصحيح هنا مع إعدادات تفادي الـ Timeout)
const mongoURI = 'mongodb+srv://test:123456@cluster0.sboz5yb.mongodb.net/ispf_database?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000 // محاولة الاتصال لمدة 5 ثوانٍ فقط لتجنب تعليق الطلبات في حال مشاكل الشبكة
})
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch((err) => console.error('❌ Could not connect to MongoDB:', err));

// 2. النماذج (Schemas)
const announcementSchema = new mongoose.Schema({ text: String });
const Announcement = mongoose.model('Announcement', announcementSchema);

const fileSchema = new mongoose.Schema({
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const JournalFile = mongoose.model('JournalFile', fileSchema);

// 3. مسار جلب البيانات للموقع (الواجهة الرئيسية تقرأ من هنا)
app.get('/api/data', async (req, res) => {
    try {
        const announcement = await Announcement.findOne() || { text: "بدء استقبال الأبحاث والأوراق العلمية للنشر في المجلات المدرجة Scopus لعام 2026م." };
        const files = await JournalFile.find().sort({ createdAt: -1 });
        res.json({ announcement: announcement.text, files: files });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. مسار التحديث المحمي (للمدير فقط بكلمة مرور صارمة)
app.post('/api/update-announcement', async (req, res) => {
    const { newText, password, fileTitle, fileUrl } = req.body;
    
    // التحقق من كلمة المرور عبر المتغير البيئي في Render أو القيمة الافتراضية الثابتة
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
        res.status(500).send('حدث خطأ أثناء التحديث: ' + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
