const db = require("../config/db");
const mysql = require("mysql2/promise");

exports.getCashFlowReport = async (req, res) => {
  try {
    const userId = req.query.user_id ? parseInt(req.query.user_id) : null;
const startDate = req.query.startDate ? req.query.startDate : null;
const endDate = req.query.endDate ? req.query.endDate : null;

if (!userId) {
  return res.status(400).json({ message: "กรุณาระบุ user_id" });
}

if (!startDate || !endDate) {
  return res.status(400).json({ message: "กรุณาระบุ startDate และ endDate" });
}
    const [summary] = await db.promise().query(
      `
         SELECT 
    COUNT(DISTINCT a.plot_id) AS plotCount,
    FLOOR(SUM(a.area_rai)) AS rai, 
    ROUND(MOD(SUM(a.area_rai) * 400, 400)) AS wa,
    CONCAT(
        FLOOR(SUM(a.area_rai)), ' ไร่ ', 
        ROUND(MOD(SUM(a.area_rai) * 400, 400)), ' ตารางวา'
    ) AS totalArea,
    COALESCE(SUM(b.net_weight_kg), 0) AS totalHarvest
FROM plots a
LEFT JOIN (
    SELECT plot_id, SUM(net_weight_kg) AS net_weight_kg
    FROM harvests
    WHERE harvest_date BETWEEN ? AND ?
    AND is_delete = 0
    GROUP BY plot_id
) b ON a.plot_id = b.plot_id
WHERE a.user_id = ?
AND a.is_delete = 0;

       ` ,
      [startDate, endDate, userId]
    );

    

    const [IncomExpent] = await db.promise().query(
      `
           SELECT 
    COALESCE(SUM(totalIncome), 0) AS totalIncome, 
    COALESCE(SUM(totalExpense), 0) AS totalExpense, 
    COALESCE(SUM(totalIncome), 0) - COALESCE(SUM(totalExpense), 0) AS netIncome
    FROM (
    -- ✅ รวมรายรับ
    SELECT user_id, SUM(amount) AS totalIncome, 0 AS totalExpense
    FROM harvests
    WHERE user_id = ? 
    AND harvest_date BETWEEN ? AND ?  -- ✅ ใช้ช่วงวันที่แทน
    AND is_delete = 0
    GROUP BY user_id
    
    UNION ALL
    
    -- ✅ รวมรายจ่าย
    SELECT user_id, 0 AS totalIncome, 
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
    AND e.expenses_date BETWEEN ? AND ?  -- ✅ ใช้ช่วงวันที่แทน
    AND e.is_deleted = 0
    GROUP BY e.user_id
    ) AS combined_data;
      `,
      [userId, startDate, endDate, userId, startDate, endDate]
    );

    

    // ✅ ดึงข้อมูลรายรับ-รายจ่ายแยกตามเดือน (เฉพาะช่วงที่เลือก)
    const [monthlyIncomeExpense] = await db.promise().query(
      `
      WITH RECURSIVE months AS (
          -- ✅ เริ่มที่เดือนแรกของช่วงที่เลือก
          SELECT DATE_FORMAT(?, '%Y-%m-01') AS month
          UNION ALL
          -- ✅ เพิ่มเดือนถัดไปทีละ 1 เดือน จนกว่าจะถึงเดือนสุดท้าย
          SELECT DATE_ADD(month, INTERVAL 1 MONTH)
          FROM months
          WHERE month < DATE_FORMAT(?, '%Y-%m-01')
      )
      SELECT 
          DATE_FORMAT(months.month, '%Y-%m') AS month,
          COALESCE(incomeData.totalIncome, 0) AS totalIncome,
          COALESCE(expenseData.totalExpense, 0) AS totalExpense,
          COALESCE(incomeData.totalIncome, 0) - COALESCE(expenseData.totalExpense, 0) AS netIncome
      FROM months
      LEFT JOIN (
          -- ✅ รายรับรายเดือน (รวมปีและเดือน)
          SELECT DATE_FORMAT(harvest_date, '%Y-%m') AS month, SUM(amount) AS totalIncome
          FROM harvests
          WHERE user_id = ? 
          AND harvest_date BETWEEN ? AND ?
          AND is_delete = 0
          GROUP BY month
      ) incomeData ON DATE_FORMAT(months.month, '%Y-%m') = incomeData.month
      LEFT JOIN (
          -- ✅ รายจ่ายรายเดือน (รวมปีและเดือน)
          SELECT DATE_FORMAT(e.expenses_date, '%Y-%m') AS month, 
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
          AND e.expenses_date BETWEEN ? AND ?
          AND e.is_deleted = 0
          GROUP BY month
      ) expenseData ON DATE_FORMAT(months.month, '%Y-%m') = expenseData.month
      ORDER BY DATE_FORMAT(months.month, '%Y-%m');

      `,
      [startDate, endDate, userId, startDate, endDate, userId, startDate, endDate]
);

    


    const [categoryExpents] = await db.promise().query(
      `
           SELECT 
              e.category AS expenseCategory, 
              COUNT(e.expense_id) AS totalRecords,  -- ✅ จำนวนครั้งที่มีค่าใช้จ่ายในประเภทนี้
              SUM(
                  COALESCE(h.total_price, 0) + COALESCE(f.total_price, 0) + COALESCE(he.total_price, 0) + 
                  COALESCE(fu.total_price, 0) + COALESCE(cv.total_price, 0) + COALESCE(er.repair_cost, 0) + 
                  COALESCE(ep.purchase_price, 0) + COALESCE(l.total_price, 0) + COALESCE(ex.total_price, 0) + 
                  COALESCE(tc.total_price, 0) + COALESCE(pl.total_price, 0) + COALESCE(ws.total_price, 0) + 
                  COALESCE(hs.total_price, 0)
              ) AS totalAmount
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
          AND e.expenses_date BETWEEN ? AND ?  -- ✅ ใช้ช่วงวันที่แทน
          AND e.is_deleted = 0
          GROUP BY e.category
          ORDER BY totalAmount DESC;  
      `,
      [userId, startDate, endDate]
    );
    

    const [expenseDetails] = await db.promise().query(
      `
        WITH ExpenseDetails AS (
            SELECT 
                e.category AS expense_detail, 
                SUM(
                    COALESCE(h.total_price, 0) + COALESCE(f.total_price, 0) + COALESCE(he.total_price, 0) + 
                    COALESCE(fu.total_price, 0) + COALESCE(cv.total_price, 0) + COALESCE(er.repair_cost, 0) + 
                    COALESCE(ep.purchase_price, 0) + COALESCE(l.total_price, 0) + COALESCE(ex.total_price, 0) + 
                    COALESCE(tc.total_price, 0) + COALESCE(pl.total_price, 0) + COALESCE(ws.total_price, 0) + 
                    COALESCE(hs.total_price, 0)
                ) AS total_amount
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
            AND e.expenses_date BETWEEN ? AND ?  -- ✅ ใช้ช่วงวันที่แทน
            AND e.is_deleted = 0  
            GROUP BY e.category  -- ✅ รวมค่าใช้จ่ายตามประเภท
        ),
        TotalSum AS (
            SELECT COALESCE(SUM(total_amount), 0) AS total_sum FROM ExpenseDetails
        )
        SELECT 
            e.expense_detail,
            e.total_amount,
            ROUND((e.total_amount / NULLIF(t.total_sum, 0)) * 100, 2) AS percentage_of_expense -- ✅ ป้องกันหารด้วยศูนย์
        FROM ExpenseDetails e
        CROSS JOIN TotalSum t
        ORDER BY e.total_amount DESC;
      `,
      [userId, startDate, endDate]
    );


    const [ExpenseIncomePlot] = await db.promise().query(
      `
WITH IncomeData AS (
    SELECT 
        h.plot_id, 
        h.user_id,
        SUM(h.amount) AS totalIncome
    FROM harvests h
    WHERE h.user_id = ?
      AND h.harvest_date BETWEEN ? AND ?
      AND h.is_delete = 0
    GROUP BY h.plot_id, h.user_id
),
ExpenseData AS (
    SELECT 
        COALESCE(h.plot_id, f.plot_id, he.plot_id, fu.plot_id, cv.plot_id, 
                 l.plot_id, ex.plot_id, tc.plot_id, pl.plot_id, ws.plot_id, 
                 hs.plot_id, 'ไม่ระบุแปลง') AS plot_id,
        e.user_id,
        e.category AS expenseCategory,
        SUM(
            COALESCE(h.total_price, 0) + COALESCE(f.total_price, 0) + 
            COALESCE(he.total_price, 0) + COALESCE(fu.total_price, 0) + 
            COALESCE(cv.total_price, 0) + COALESCE(er.repair_cost, 0) + 
            COALESCE(ep.purchase_price, 0) + COALESCE(l.total_price, 0) + 
            COALESCE(ex.total_price, 0) + COALESCE(tc.total_price, 0) + 
            COALESCE(pl.total_price, 0) + COALESCE(ws.total_price, 0) + 
            COALESCE(hs.total_price, 0)
        ) AS expenseAmount
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
      AND e.expenses_date BETWEEN ? AND ?
      AND e.is_deleted = 0
    GROUP BY plot_id, e.category
),
Combined AS (
    SELECT
        i.plot_id,
        i.totalIncome,
        COALESCE(e.expenseAmount, 0) AS totalExpense,
        e.expenseCategory,
        e.expenseAmount
    FROM IncomeData i
    LEFT JOIN ExpenseData e ON i.plot_id = e.plot_id

    UNION ALL

    SELECT
        e.plot_id,
        0 AS totalIncome,
        e.expenseAmount AS totalExpense,
        e.expenseCategory,
        e.expenseAmount
    FROM ExpenseData e
    WHERE e.plot_id NOT IN (SELECT plot_id FROM IncomeData)
)
SELECT 
    COALESCE(p.plot_name, 'ไม่ระบุแปลง') AS plot_name,  -- ✅ ใช้ plot_name แทน plot_id
    SUM(totalIncome) AS totalIncome,
    SUM(totalExpense) AS totalExpense,
    (SUM(totalIncome) - SUM(totalExpense)) AS netIncome,
     IFNULL(
        CONCAT(
            '{',
            GROUP_CONCAT(CONCAT('"', expenseCategory, '":', expenseAmount) SEPARATOR ','),
            '}'
        ),
        '{}'
    ) AS expenseCategory 
FROM Combined c
LEFT JOIN plots p ON p.plot_id = c.plot_id  -- ✅ ใช้ JOIN เพื่อดึงชื่อแปลง
GROUP BY p.plot_name
ORDER BY p.plot_name;

` , [userId, startDate, endDate, userId, startDate, endDate]);

// ✅ แปลง JSON String ให้เป็น Object ก่อนส่งไปยัง Angular
const formattedData = ExpenseIncomePlot.map(plot => {
    let expenseCategoryObj = {};

    // ✅ ตรวจสอบก่อนแปลง JSON
    if (typeof plot.expenseCategory === "string" && plot.expenseCategory.startsWith("{")) {
        try {
            expenseCategoryObj = JSON.parse(plot.expenseCategory.replace(/\\"/g, '"'));
        } catch (error) {
            console.error("❌ Error parsing expenseCategory:", error);
        }
    }

    return {
        ...plot,
        expenseCategory: expenseCategoryObj // ✅ ตอนนี้เป็น Object แล้ว
    };
});
    res.json({
      summary: summary[0] || {},
      IncomExpent: IncomExpent[0] || {},
      monthlyIncomeExpense: monthlyIncomeExpense || [],
      categoryExpents: categoryExpents || [],
      expenseDetails: expenseDetails || [],
      ExpenseIncomePlot: formattedData  || [],
      startDate,   // ✅ เปลี่ยนจาก selectedYear เป็น startDate
      endDate,     // ✅ เพิ่ม endDate เพื่อให้แสดงช่วงวันที่ที่ใช้จริง
      userId,
});
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
};
