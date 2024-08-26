const express = require('express');
const router = express.Router();

const registerController = require('../controllers/registerController');
const loginController = require('../controllers/loginController');
const profileController = require('../controllers/profileController');
const userController = require('../controllers/getUser');

const workerController = require('../controllers/workerController');

// เส้นทางสำหรับการดึงข้อมูลผู้ใช้
router.get('/user', userController.user);

// เส้นทางสำหรับการลงทะเบียน
router.post('/register', registerController.register);

// เส้นทางสำหรับการเข้าสู่ระบบ
router.post('/login', loginController.login);


// ดึงข้อมูลโปรไฟล์โดยใช้ query parameters
router.get('/profileuser', profileController.getProfile);

// อัปเดตข้อมูลโปรไฟล์
router.put('/profileuser', profileController.updateProfile);

// เปลี่ยนรหัสผ่าน
router.post('/change-password', profileController.changePassword);


// สร้าง Worker ใหม่
router.post('/workers', workerController.createWorker);

// รับข้อมูล Worker ทั้งหมด หรือค้นหาตาม user_id
router.get('/workers/:user_id?', workerController.getAllWorkers);

// รับข้อมูล Worker โดยใช้ ID
router.get('/workers/:id', workerController.getWorkerById);

// อัปเดตข้อมูล Worker
router.put('/workers/:id', workerController.updateWorker);

// ลบข้อมูล Worker
router.delete('/workers/:id', workerController.deleteWorker);


module.exports = router;
