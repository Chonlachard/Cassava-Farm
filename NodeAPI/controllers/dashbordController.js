const db = require('../config/db');
const mysql = require('mysql2/promise');

// getPlotAnalytics ฟังก์ชันที่ไม่ต้องแก้ไข
exports.getPlotAnalytics = async (req, res) => {
    const userId = req.params.user_id || req.body.user_id || req.query.user_id;

    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    const query = `
        SELECT 
            COUNT(DISTINCT p.plot_id) AS totalPlots,
            CAST(SUM(p.area_rai) AS SIGNED) AS totalArea,
            SUM(h.net_weight_kg) AS totalProduction
        FROM plots p
        LEFT JOIN harvests h ON p.plot_id = h.plot_id
        WHERE p.user_id = ?;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
        }

        if (results.length === 0 || !results[0].totalPlots) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลแปลงสำหรับผู้ใช้ที่ระบุ' });
        }

        res.json(results[0]);  // ส่งคืนเฉพาะผลลัพธ์ที่สำคัญ เช่น totalPlots, totalArea, totalProduction
    });
};

exports.availableYears = async (req, res) => {
    const userId = req.query.user_id; // รับ user_id จาก query

    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    const query = `
        SELECT DISTINCT YEAR(harvest_date) AS year 
        FROM harvests 
        WHERE user_id = ?
        UNION
        SELECT DISTINCT YEAR(expense_date) AS year 
        FROM expenses 
        WHERE user_id = ?
    `;

    db.query(query, [userId, userId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลปีที่มีการเก็บเกี่ยว' });
        }

        res.json(results);
    });
};


// ฟังก์ชัน financialData

exports.financialData = (req, res) => {
    const { year, user_id } = req.query;

    if (!year || !user_id) {
        return res.status(400).json({ message: 'กรุณาระบุ year และ user_id' });
    }

    const queryIncome = `
        SELECT MONTH(harvest_date) AS month, SUM(amount) AS income
        FROM harvests
        WHERE YEAR(harvest_date) = ? AND user_id = ?
        GROUP BY MONTH(harvest_date)
    `;

    const queryExpenses = `
        SELECT MONTH(expense_date) AS month, SUM(amount) AS expenses
        FROM expenses
        WHERE YEAR(expense_date) = ? AND user_id = ?
        GROUP BY MONTH(expense_date)
    `;

    db.query(queryIncome, [year, user_id], (err, incomeRows) => {
        if (err) {
            console.error('Error fetching income data:', err);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายรับ' });
        }

        db.query(queryExpenses, [year, user_id], (err, expensesRows) => {
            if (err) {
                console.error('Error fetching expenses data:', err);
                return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายจ่าย' });
            }

            const incomeExpenses = Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                const incomeData = incomeRows.find(i => i.month === month) || { income: 0 };
                const expenseData = expensesRows.find(e => e.month === month) || { expenses: 0 };
                const income = Number(incomeData.income) || 0;
                const expenses = Number(expenseData.expenses) || 0;
                const profit = income - expenses;
                return {
                    month,
                    income,
                    expenses,
                    profit
                };
            });

            const totalIncome = incomeRows.reduce((sum, i) => sum + Number(i.income || 0), 0);
            const totalExpenses = expensesRows.reduce((sum, e) => sum + Number(e.expenses || 0), 0);
            const totalProfit = totalIncome - totalExpenses;

            const summary = {
                totalIncome,
                totalExpenses,
                totalProfit,
                status: totalProfit > 0 ? 'กำไร' : totalProfit < 0 ? 'ขาดทุน' : 'เท่าทุน'
            };

            res.json({ summary, incomeExpenses });
        });
    });
};

