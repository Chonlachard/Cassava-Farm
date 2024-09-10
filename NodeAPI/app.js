const express = require('express');
const cors = require('cors');
const path = require('path');
const dataRoutes = require('./routes/dataRoutes'); // ใช้เส้นทาง dataRoutes

const app = express();

// เปิดใช้งาน CORS
app.use(cors());

// ใช้ express.json() กับ limit เพื่อกำหนดขนาดสูงสุดของ payload
app.use(express.json({ limit: '10mb' })); // ปรับขนาดสูงสุดตามที่คุณต้องการ

// ใช้ express.urlencoded() กับ limit เพื่อกำหนดขนาดสูงสุดของ form-data (ถ้าจำเป็น)
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ใช้เส้นทางสำหรับการลงทะเบียนและการเข้าสู่ระบบ
app.use('/api', dataRoutes); // ใช้ '/api' เป็นพื้นฐานสำหรับเส้นทาง

// เส้นทางสำหรับไฟล์ static (เช่น รูปภาพ, CSS, JS)
app.use(express.static(path.join(__dirname, 'public'))); // เส้นทางสำหรับไฟล์ static

// เส้นทางสำหรับไฟล์ที่อัปโหลด
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); // เส้นทางสำหรับไฟล์ที่อัปโหลด

const PORT = process.env.PORT || 3000; // ใช้ตัวแปรสภาพแวดล้อมสำหรับพอร์ต

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
