const express = require('express');
const multer = require('multer'); // นำเข้า multer
const fs = require('fs'); // นำเข้า fs
const path = require('path'); // นำเข้า path

const router = express.Router();

const registerController = require('../controllers/registerController');
const loginController = require('../controllers/loginController');
const profileController = require('../controllers/profileController');
const userController = require('../controllers/getUser');

const expensesController = require('../controllers/expensesController');
const plotController = require('../controllers/plotsController');
const getPlotController = require('../controllers/getPlotController');
const harvestController = require('../controllers/harvestsController');
const workerController = require('../controllers/workerController')
const dashbordController = require('../controllers/dashbordController')

// การตั้งค่า Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

//dashboard
router.get('/getPlotAnalytics', dashbordController.getPlotAnalytics);




//Worker
router.get('/getWorkers',workerController.getWorker)
router.post('/addWorker' , workerController.addWorker)
router.delete('/deleteWorker/:worker_id' , workerController.deleteWorker)

router.get('/getEditWorker/:worker_id', workerController.getUpdateWorker);
router.put('/editWorker', workerController.editWorker);

// เส้นทางสำหรับเพิ่มการเก็บเกี่ยว
router.post('/addharvest', harvestController.addHarvest);

// เส้นทางสำหรับดลบข้อมูลการเก็บเกี่ยว
router.delete('/deleteharvest/:harvest_id', harvestController.deleteHarvest);

router.get('/getEditHarvest/:harvest_id', harvestController.getUpdateHarvest);

// เส้นทางสำหรับอัปเดตข้อมูลการเก็บเกี่ยว
router.put('/updateharvest', harvestController.updateHarvest);
// เส้นทางสำหรับดึงข้อมูลการเก็บเกี่ยว
router.get('/getharvests', harvestController.getHarvests);
router.get('/getSerch', harvestController.getSerch);

// Route สำหรับการอัปโหลด plot
router.post('/addplots', upload.single('image'), plotController.handlePlotUpload);

// Route สำหรับการดึงข้อมูล plot
router.get('/getplots',  getPlotController.getPlots);

// Route สำหรับการลบ plot
router.delete('/deleteplot/:plot_id', getPlotController.deletePlot);

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

// ใช้ query parameter สำหรับลบค่าใช้จ่าย
router.delete('/expenses/:expense_id', expensesController.deleteExpense);

// อัพเดตข้อมูลค่าใช้จ่าย
router.put('/editExpenses', expensesController.updateExpense);

// Route สำหรับดึงข้อมูลตาม expense_id
router.get('/getExpenseEdit/:expense_id', expensesController.getExpenseEdit);

// เพิ่ม Route สำหรับการค้นหาข้อมูลตามช่วงวันที่
router.get('/expenses/date-range', expensesController.getExpensesByDateRange);

module.exports = router;
