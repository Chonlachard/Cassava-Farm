const db = require('../config/db');
const mysql = require('mysql2/promise');


exports.getCashFlowReport = async (req, res) => {
    try {
        const userId = req.query.user_id ? parseInt(req.query.user_id) : null;
        const selectedYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

        if (!userId) {
            return res.status(400).json({ message: "กรุณาระบุ user_id" });
        }

        const [summary] = await db.promise().query(`
            SELECT 
                COUNT(DISTINCT a.plot_id) AS plotCount,
                FLOOR(SUM(a.area_rai)) AS totalArea,
                COALESCE(SUM(b.net_weight_kg), 0) AS totalHarvest,
                COALESCE(MAX(YEAR(b.latestHarvestDate)), ?) AS selectedYear
            FROM plots a
            LEFT JOIN (
                SELECT plot_id, SUM(net_weight_kg) AS net_weight_kg, MAX(harvest_date) AS latestHarvestDate
                FROM harvests
                WHERE YEAR(harvest_date) = ?
                GROUP BY plot_id
            ) b ON a.plot_id = b.plot_id
            WHERE a.user_id = ?
            AND a.is_delete = 0;
        `, [selectedYear, selectedYear, userId]);

        const [IncomExpent] = await db.promise().query(`
            SELECT 
    COALESCE(totalIncome, 0) AS totalIncome, 
    COALESCE(totalExpense, 0) AS totalExpense, 
    COALESCE(totalIncome, 0) - COALESCE(totalExpense, 0) AS netIncome
FROM (
    -- ✅ รวมรายรับ
    SELECT user_id, SUM(amount) AS totalIncome, NULL AS totalExpense
    FROM harvests
    WHERE user_id = ?
    AND YEAR(harvest_date) = ?
    GROUP BY user_id
    UNION ALL
    -- ✅ รวมรายจ่าย
    SELECT user_id, NULL AS totalIncome, 
        SUM(
            COALESCE(h.total_price, f.total_price, he.total_price, fu.total_price, cv.total_price, 
                     er.repair_cost, ep.purchase_price, l.total_price, ex.total_price, 
                     tc.total_price, pl.total_price, ws.total_price, hs.total_price, 0)
        ) AS totalExpense
    FROM expenses e
    LEFT JOIN HormoneData h ON e.expense_id = h.expense_id
    LEFT JOIN FertilizerData f ON e.expense_id = f.expense_id
    LEFT JOIN HerbicideData he ON e.expense_id = he.expense_id
    LEFT JOIN FuelData fu ON e.expense_id = fu.expense_id
    LEFT JOIN CassavaVarietyData cv ON e.expense_id = cv.expense_id
    LEFT JOIN EquipmentRepairData er ON e.expense_id = er.expense_id
    LEFT JOIN EquipmentPurchaseData ep ON e.expense_id = ep.expense_id
    LEFT JOIN LandRentalData l ON e.expense_id = l.expense_id
    LEFT JOIN ExcavationData ex ON e.expense_id = ex.expense_id
    LEFT JOIN TreeCutting tc ON e.expense_id = tc.expense_id
    LEFT JOIN Planting pl ON e.expense_id = pl.expense_id
    LEFT JOIN WeedSpraying ws ON e.expense_id = ws.expense_id
    LEFT JOIN HormoneSpraying hs ON e.expense_id = hs.expense_id
    WHERE e.user_id = ?
    AND YEAR(e.expenses_date) = ?
    GROUP BY e.user_id
) AS combined_data; 
            `, [userId, selectedYear, userId, selectedYear]);

            // ✅ ดึงข้อมูลรายรับ-รายจ่ายแยกตามเดือน
        const [monthlyIncomeExpense] = await db.promise().query(`
            SELECT 
                months.month AS month,
                COALESCE(SUM(incomeData.totalIncome), 0) AS totalIncome,
                COALESCE(SUM(expenseData.totalExpense), 0) AS totalExpense,
                COALESCE(SUM(incomeData.totalIncome), 0) - COALESCE(SUM(expenseData.totalExpense), 0) AS netIncome
            FROM (
                SELECT 1 AS month UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL 
                SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL 
                SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL 
                SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
            ) months
            LEFT JOIN (
                -- ✅ รายรับรายเดือน
                SELECT MONTH(harvest_date) AS month, SUM(amount) AS totalIncome
                FROM harvests
                WHERE user_id = ?
                AND YEAR(harvest_date) = ?
                GROUP BY MONTH(harvest_date)
            ) incomeData ON months.month = incomeData.month
            LEFT JOIN (
                -- ✅ รายจ่ายรายเดือน
                SELECT MONTH(e.expenses_date) AS month, 
                    SUM(
                        COALESCE(h.total_price, 0) + COALESCE(f.total_price, 0) + COALESCE(he.total_price, 0) + 
                        COALESCE(fu.total_price, 0) + COALESCE(cv.total_price, 0) + COALESCE(er.repair_cost, 0) + 
                        COALESCE(ep.purchase_price, 0) + COALESCE(l.total_price, 0) + COALESCE(ex.total_price, 0) + 
                        COALESCE(tc.total_price, 0) + COALESCE(pl.total_price, 0) + COALESCE(ws.total_price, 0) + 
                        COALESCE(hs.total_price, 0)
                    ) AS totalExpense
                FROM expenses e
                LEFT JOIN HormoneData h ON e.expense_id = h.expense_id
                LEFT JOIN FertilizerData f ON e.expense_id = f.expense_id
                LEFT JOIN HerbicideData he ON e.expense_id = he.expense_id
                LEFT JOIN FuelData fu ON e.expense_id = fu.expense_id
                LEFT JOIN CassavaVarietyData cv ON e.expense_id = cv.expense_id
                LEFT JOIN EquipmentRepairData er ON e.expense_id = er.expense_id
                LEFT JOIN EquipmentPurchaseData ep ON e.expense_id = ep.expense_id
                LEFT JOIN LandRentalData l ON e.expense_id = l.expense_id
                LEFT JOIN ExcavationData ex ON e.expense_id = ex.expense_id
                LEFT JOIN TreeCutting tc ON e.expense_id = tc.expense_id
                LEFT JOIN Planting pl ON e.expense_id = pl.expense_id
                LEFT JOIN WeedSpraying ws ON e.expense_id = ws.expense_id
                LEFT JOIN HormoneSpraying hs ON e.expense_id = hs.expense_id
                WHERE e.user_id = ?
                AND YEAR(e.expenses_date) = ?
                GROUP BY MONTH(e.expenses_date)
            ) expenseData ON months.month = expenseData.month
            GROUP BY months.month
            ORDER BY months.month;

            `, [userId, selectedYear, userId, selectedYear]);

        res.json({
            summary: summary[0] || {},
            IncomExpent: IncomExpent[0] || {},
            monthlyIncomeExpense: monthlyIncomeExpense || [],
            selectedYear,
            userId
        });

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};



