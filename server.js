const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // مكتبة التشفير

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));

// مفتاح التشفير الخاص بك
const SECRET_KEY = 'ts-store1';

// دالة التشفير (تستخدم لتشفير كلمات السر والأكواد)
function encrypt(text) {
    if (!text) return text;
    return crypto.createHmac('sha256', SECRET_KEY).update(text).digest('hex');
}

// ملفات البيانات المنفصلة
const FILES = {
    products: path.join(__dirname, 'products.json'),
    orders: path.join(__dirname, 'orders.json'),
    users: path.join(__dirname, 'users.json'),
    staff: path.join(__dirname, 'staff.json'),
    pays: path.join(__dirname, 'pays.json')
};

function readTable(name) {
    try {
        if (!fs.existsSync(FILES[name])) {
            fs.writeFileSync(FILES[name], '[]');
            return [];
        }
        return JSON.parse(fs.readFileSync(FILES[name], 'utf8'));
    } catch (e) {
        return [];
    }
}

function writeTable(name, data) {
    fs.writeFileSync(FILES[name], JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// ========== المنتجات ==========
app.get('/api/products', (req, res) => { res.json(readTable('products')); });
app.post('/api/products', (req, res) => {
    const data = readTable('products');
    const item = req.body;
    if (item.id === undefined || item.id === null) item.id = Date.now();
    const idx = data.findIndex(p => p.id === item.id);
    if (idx >= 0) { data[idx] = item; } else { data.push(item); }
    writeTable('products', data);
    res.json({ success: true, data: item });
});
app.delete('/api/products/:id', (req, res) => {
    const data = readTable('products').filter(p => p.id !== Number(req.params.id));
    writeTable('products', data);
    res.json({ success: true });
});

// ========== الطلبات (مع إضافة بصمة التشفير) ==========
app.get('/api/orders', (req, res) => { res.json(readTable('orders')); });
app.post('/api/orders', (req, res) => {
    const data = readTable('orders');
    const item = req.body;
    if (!item.id) item.id = 'TS-' + Date.now().toString(36).toUpperCase();
    
    // تشفير كود الشراء إذا وجد لزيادة الأمان
    if(item.purchaseCode) item.purchaseCode_hash = encrypt(item.purchaseCode);
    
    data.push(item);
    writeTable('orders', data);
    res.json({ success: true, data: item });
});
app.put('/api/orders/:id', (req, res) => {
    const data = readTable('orders');
    const idx = data.findIndex(o => o.id === req.params.id);
    if (idx >= 0) {
        data[idx] = { ...data[idx], ...req.body };
        writeTable('orders', data);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'not found' });
    }
});
app.delete('/api/orders/:id', (req, res) => {
    const data = readTable('orders').filter(o => o.id !== req.params.id);
    writeTable('orders', data);
    res.json({ success: true });
});

// ========== الأعضاء (تشفير كلمة السر) ==========
app.get('/api/users', (req, res) => { res.json(readTable('users')); });
app.post('/api/users', (req, res) => {
    const data = readTable('users');
    const user = req.body;
    // تشفير كلمة السر قبل الحفظ
    if(user.password) user.password = encrypt(user.password);
    data.push(user);
    writeTable('users', data);
    res.json({ success: true });
});

// ========== الموظفين ==========
app.get('/api/staff', (req, res) => { res.json(readTable('staff')); });
app.post('/api/staff', (req, res) => {
    const data = readTable('staff');
    const item = req.body;
    // تشفير كلمة مرور الموظف
    if(item.password) item.password = encrypt(item.password);
    const idx = data.findIndex(s => s.email === item.email);
    if (idx >= 0) { data[idx] = item; } else { data.push(item); }
    writeTable('staff', data);
    res.json({ success: true });
});

// ========== طرق الدفع ==========
app.get('/api/pays', (req, res) => { res.json(readTable('pays')); });
app.post('/api/pays', (req, res) => {
    const data = readTable('pays');
    const item = req.body;
    const idx = data.findIndex(p => p.id === item.id);
    if (idx >= 0) { data[idx] = item; } else { data.push(item); }
    writeTable('pays', data);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('🛡️ TS Store Secure API running on port ' + PORT);
});
