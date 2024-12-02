const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Controllers Import
const registerController = require('../controllers/registerController');
const loginController = require('../controllers/loginController');
const profileController = require('../controllers/profileController');
const userController = require('../controllers/getUser');
const expensesController = require('../controllers/expensesController');
const plotController = require('../controllers/plotsController');
const getPlotController = require('../controllers/getPlotController');
const harvestController = require('../controllers/harvestsController');
const workerController = require('../controllers/workerController');
const dashbordController = require('../controllers/dashbordController');
const { sendOTP, verifyOTP, changePassword, resendOTP } = require('../controllers/passwordController');

// Multer Configuration
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

// 1. Authentication Routes
// ─────────────────────────────────────────
// Login & Register
router.post('/register', registerController.register);
router.post('/login', loginController.login);

// Password Management
router.post('/sendOTP', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/change-password', changePassword);
router.post('/resendOtp', resendOTP);

// 2. User Profile Routes
// ─────────────────────────────────────────
router.get('/user', userController.user);
router.get('/profileuser', profileController.getProfile);
router.put('/profileuser', profileController.updateProfile);
router.post('/change-password', profileController.changePassword);

// 3. Dashboard Routes
// ─────────────────────────────────────────
router.get('/getPlotAnalytics', dashbordController.getPlotAnalytics);
router.get('/availableYears', dashbordController.availableYears);
router.get('/financialData', dashbordController.financialData);

// 4. Plot Management Routes
// ─────────────────────────────────────────
router.post('/addplots', upload.single('image'), plotController.handlePlotUpload);
router.get('/getPlotUpdate/:plot_id', getPlotController.getPlotsUpdate);
router.get('/getplots', getPlotController.getPlots);
router.delete('/deleteplot/:plot_id', getPlotController.deletePlot);
router.put('/updateplot', getPlotController.EditPlot);

// 5. Harvest Management Routes
// ─────────────────────────────────────────
router.post('/addharvest', harvestController.addHarvest);
router.get('/getHarvestImage/:harvest_id', harvestController.getHarvestImage);
router.delete('/deleteharvest/:harvest_id', harvestController.deleteHarvest);
router.get('/getEditHarvest/:harvest_id', harvestController.getUpdateHarvest);
router.put('/updateharvest', harvestController.updateHarvest);
router.get('/getharvests', harvestController.getHarvests);
router.get('/getSerch', harvestController.getSerch);

// 6. Worker Management Routes
// ─────────────────────────────────────────
router.get('/getWorkers', workerController.getWorker);
router.post('/addWorker', workerController.addWorker);
router.delete('/deleteWorker/:worker_id', workerController.deleteWorker);
router.get('/getEditWorker/:worker_id', workerController.getUpdateWorker);
router.put('/editWorker', workerController.editWorker);

// 7. Expense Management Routes
// ─────────────────────────────────────────
router.get('/getExpenses', expensesController.getExpense);
router.get('/getDeopdowplot', expensesController.getDeopdowplot);
router.post('/addExpenses', expensesController.addExpense);
router.delete('/expenses/:expense_id', expensesController.deleteExpense);
router.put('/editExpenses', expensesController.updateExpense);
router.get('/getExpenseEdit/:expense_id', expensesController.getExpenseEdit);
router.get('/expenses/date-range', expensesController.getExpensesByDateRange);

module.exports = router;