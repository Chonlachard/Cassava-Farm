const express = require('express');
const router = express.Router();

const registerController = require('../controllers/registerController');
const loginController = require('../controllers/loginController');
const profileController = require('../controllers/profileController');
const userController = require('../controllers/getUser');

const expensesController = require('../controllers/expensesController');


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

router.get('/getExpenses', expensesController.getExpense);

router.post('/addExpenses', expensesController.addExpense);



module.exports = router;
