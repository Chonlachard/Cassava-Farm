const express = require('express');
const cors = require('cors'); // นำเข้าแพ็กเกจ cors
const bodyParser = require('body-parser');
const dataRoutes = require('./routes/dataRoutes'); // ใช้เส้นทาง dataRoutes

const app = express();

// เปิดใช้งาน CORS
app.use(cors());

// ใช้ bodyParser สำหรับการจัดการข้อมูล JSON
app.use(bodyParser.json());

// ใช้เส้นทางสำหรับการลงทะเบียนและการเข้าสู่ระบบ
app.use('/api',  require('./routes/dataRoutes')); // ใช้ '/api' เป็นพื้นฐานสำหรับเส้นทาง

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
