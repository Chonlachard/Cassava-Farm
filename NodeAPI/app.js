const express = require('express');
const cors = require('cors');
const dataRoutes = require('./routes/dataRoutes'); // ใช้เส้นทาง dataRoutes

const app = express();

// เปิดใช้งาน CORS
app.use(cors());

// ใช้ bodyParser สำหรับการจัดการข้อมูล JSON
app.use(express.json()); // ใช้ express.json() แทน bodyParser.json()

// ใช้เส้นทางสำหรับการลงทะเบียนและการเข้าสู่ระบบ
app.use('/api', dataRoutes); // ใช้ '/api' เป็นพื้นฐานสำหรับเส้นทาง

const PORT = process.env.PORT || 3000; // ใช้ตัวแปรสภาพแวดล้อมสำหรับพอร์ต

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
