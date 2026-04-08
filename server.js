const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));

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
    fs.writeFileSync(FILES[name], JSON.stringify(data, null, 2));
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

// ========== الطلبات ==========
app.get('/api/orders', (req, res) => { res.json(readTable('orders')); });
app.post('/api/orders', (req, res) => {
    const data = readTable('orders');
    const item = req.body;
    if (!item.id) item.id = 'TS-' + Date.now().toString(36).toUpperCase();
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

// ========== الأعضاء ==========
app.get('/api/users', (req, res) => { res.json(readTable('users')); });
app.post('/api/users', (req, res) => {
    const data = readTable('users');
    data.push(req.body);
    writeTable('users', data);
    res.json({ success: true });
});
app.delete('/api/users/:email', (req, res) => {
    const data = readTable('users').filter(u => u.email !== req.params.email);
    writeTable('users', data);
    res.json({ success: true });
});

// ========== الموظفين ==========
app.get('/api/staff', (req, res) => { res.json(readTable('staff')); });
app.post('/api/staff', (req, res) => {
    const data = readTable('staff');
    const item = req.body;
    const idx = data.findIndex(s => s.email === item.email);
    if (idx >= 0) { data[idx] = item; } else { data.push(item); }
    writeTable('staff', data);
    res.json({ success: true });
});
app.delete('/api/staff/:email', (req, res) => {
    const data = readTable('staff').filter(s => s.email !== decodeURIComponent(req.params.email));
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
app.delete('/api/pays/:id', (req, res) => {
    const data = readTable('pays').filter(p => p.id !== Number(req.params.id));
    writeTable('pays', data);
    res.json({ success: true });
});

// ========== توافق ==========
app.post('/api/save', (req, res) => {
    const { key, data } = req.body;
    writeTable(key, data);
    res.json({ success: true });
});
app.get('/api/load/:key', (req, res) => {
    res.json(readTable(req.params.key));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('TS Store API running on port ' + PORT);
    console.log('أدمن: ts@gmail.com / ts');
    console.log('موظف: staff@ts.com / 1234');
    console.log('عضو: test@test.com / 1234');
});