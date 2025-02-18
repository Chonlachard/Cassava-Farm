const moment = require('moment');
const db = require('../config/db'); // ใช้ db สำหรับเชื่อมต่อฐานข้อมูล

// ฟังก์ชันสำหรับดึงข้อมูลค่าใช้จ่าย
exports.getExpense = async (req, res) => {
    const { user_id, expenses_date_start, expenses_date_end, category } = req.query;

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!user_id) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    // เริ่มต้นคำสั่ง SQL
    let query = `
        SELECT 
            e.expense_id,
            e.expenses_date,
            DATE_FORMAT(e.expenses_date, '%d/%m/%Y') AS formatted_expenses_date, 
            e.category,
            COALESCE(
                h.total_price, f.total_price, he.total_price, fu.total_price, cv.total_price, 
                er.repair_cost, ep.purchase_price, l.total_price, ex.total_price, 
                tc.total_price, pl.total_price, ws.total_price, hs.total_price
            ) AS total_price
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
        WHERE e.user_id = ? AND e.is_deleted = 0
    `;

    // ตัวแปรสำหรับพารามิเตอร์ SQL
    const values = [user_id];

    // เพิ่มเงื่อนไขช่วงวันที่
    if (expenses_date_start && expenses_date_end) {
        query += ' AND e.expenses_date BETWEEN ? AND ?';
        values.push(expenses_date_start, expenses_date_end);
    }

    // เพิ่มเงื่อนไขหมวดหมู่
    if (category) {
        query += ' AND e.category = ?';
        values.push(category);
    }

    // เรียงลำดับตามวันที่
    query += ' ORDER BY e.expenses_date ASC';

    // การรันคำสั่ง SQL
    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย' });
        }

        // ส่งผลลัพธ์กลับไปในรูปแบบ JSON
        res.json(results);
    });
};
// ฟังก์ชันสำหรับเพิ่มข้อมูลค่าใช้จ่าย
exports.addExpense = async (req, res) => {
    const { user_id, category,expenses_date , details } = req.body;
    console.log('User ID:', user_id);
    console.log('Category:', category);
    console.log('Expense Date:', expenses_date);
    console.log('Details:', details);


    // ตรวจสอบข้อมูลที่ส่งมา
    if (!user_id || !category || !details) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    // ตรวจสอบประเภทข้อมูลว่าเป็นประเภทที่ถูกต้องหรือไม่
    const validCategories = [
        'ค่าฮอร์โมน', 'ค่าปุ๋ย', 'ค่ายาฆ่าหญ้า', 'ค่าน้ำมัน',
        'ค่าพันธุ์มัน', 'ค่าซ่อมอุปกรณ์', 'ค่าอุปกรณ์', 'ค่าเช่าที่ดิน',
        'ค่าขุด', 'ค่าคนตัดต้น', 'ค่าคนปลูก', 'ค่าคนฉีดยาฆ่าหญ้า', 'ค่าคนฉีดยาฮอโมน'
    ];

    if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'ประเภทข้อมูลไม่ถูกต้อง' });
    }

    // เพิ่มข้อมูลลงในฐานข้อมูล Expenses
    const query = `INSERT INTO expenses (user_id, category, expenses_date) VALUES (?, ?, ?)`;


    db.query(query, [user_id, category, expenses_date], (err, expenseResult) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลค่าใช้จ่าย' });
        }

        const expenseId = expenseResult.insertId;
        let detailQuery = '';
        let params = [];

        // สร้าง Query ตามประเภท
        switch (category) {
            case 'ค่าฮอร์โมน':
                const hormoneTotalPrice = details.price_per_bottle * details.quantity;
                detailQuery = `
                    INSERT INTO HormoneData (expense_id, brand, volume, price_per_bottle, quantity, total_price, plot_id,purchase_location)
                    VALUES (?, ?, ?, ?, ?, ?, ? , ?)
                `;
                params = [
                    expenseId,
                    details.brand,
                    details.volume,
                    details.price_per_bottle,
                    details.quantity,
                    hormoneTotalPrice,  // คำนวณ total_price
                    details.plot_id,
                    details.purchase_location
                ];
                break;

            case 'ค่าปุ๋ย':
                const fertilizerTotalPrice = details.price_per_bag * details.quantity;
                detailQuery = `
                    INSERT INTO FertilizerData (expense_id, brand, formula, price_per_bag, quantity, total_price, plot_id ,purchase_location)
                    VALUES (?, ?, ?, ?, ?, ?, ? , ?)
                `;
                params = [
                    expenseId,
                    details.brand,
                    details.formula,
                    details.price_per_bag,
                    details.quantity,
                    fertilizerTotalPrice,  // คำนวณ total_price
                    details.plot_id,
                    details.purchase_location

                ];
                break;

            case 'ค่ายาฆ่าหญ้า':
                const herbicideTotalPrice = details.price_per_bottle * details.quantity;
                detailQuery = `
                    INSERT INTO HerbicideData (expense_id, brand, volume, price_per_bottle, quantity, total_price, plot_id ,purchase_location)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.brand,
                    details.volume,
                    details.price_per_bottle,
                    details.quantity,
                    herbicideTotalPrice,  // คำนวณ total_price
                    details.plot_id,
                    details.purchase_location
                ];
                break;

            case 'ค่าน้ำมัน':
                console.log('details:', details, 'expenseId:', expenseId);
                const fuelTotalPrice = details.price_per_liter * details.quantity_liters;
                detailQuery = `
                    INSERT INTO fuelData (expense_id, price_per_liter, quantity_liters, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.price_per_liter,
                    details.quantity_liters,
                    fuelTotalPrice,  // คำนวณ total_price
                    details.plot_id
                ];
                break;

            case 'ค่าพันธุ์มัน':
                const cassavaTotalPrice = details.price_per_tree * details.quantity;
                detailQuery = `
                    INSERT INTO CassavaVarietyData (expense_id, quantity, price_per_tree, total_price, plot_id, variety_name, purchase_location)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                   
                    details.quantity,
                    details.price_per_tree,
                    cassavaTotalPrice,  // คำนวณ total_price
                    details.plot_id,
                    details.variety_name,
                    details.purchase_location
                ];
                break;

            case 'ค่าซ่อมอุปกรณ์':

                detailQuery = `
                    INSERT INTO EquipmentRepairData (expense_id, repair_names, details, repair_cost, shop_name)
                    VALUES (?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    
                    details.repair_names,
                    details.details,
                    details.repair_cost,
                    details.shop_name
                ];
                break;

            case 'ค่าอุปกรณ์':
                detailQuery = `
                    INSERT INTO EquipmentPurchaseData (expense_id,  item_name, shop_name, purchase_price, descript)
                    VALUES (?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                   
                    details.item_name,
                    details.shop_name,
                    details.purchase_price,
                    details.descript
                ];
                break;

            case 'ค่าเช่าที่ดิน':
                const rentalTotalPrice = details.price_per_rai * details.area;
                detailQuery = `
                    INSERT INTO LandRentalData (expense_id, owner_name, owner_phone, area, price_per_rai, rental_period, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    
                    details.owner_name,
                    details.owner_phone,
                    details.area,
                    details.price_per_rai,
                    details.rental_period,
                    rentalTotalPrice,  // ใช้ total_price ที่ส่งมาจากหน้า
                    details.plot_id
                ];
                break;

            case 'ค่าขุด':
                const excavationTotalPrice = details.weight * (details.price_per_ton / 1000);
                detailQuery = `
                    INSERT INTO ExcavationData (expense_id,  weight, price_per_ton, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                  
                    details.weight,
                    details.price_per_ton,
                    excavationTotalPrice,  // ใช้ total_price ที่ส่งมาจากหน้า
                    details.plot_id
                ];
                break;

            case 'ค่าคนตัดต้น':
                const cuttingTotalPrice = details.price_per_tree * details.number_of_trees;
                detailQuery = `
                    INSERT INTO TreeCutting (expense_id,  number_of_trees, price_per_tree, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                   
                    details.number_of_trees,
                    details.price_per_tree,
                    cuttingTotalPrice,
                    details.plot_id
                ];
                console.log(cuttingTotalPrice);
                break;

            case 'ค่าคนปลูก':
                const plantingTotalPrice = details.price_per_rai * details.land_area;
                detailQuery = `
                    INSERT INTO Planting (expense_id, worker_name, land_area, price_per_rai, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    
                    details.worker_name,
                    details.land_area,
                    details.price_per_rai,
                    plantingTotalPrice,  // ใช้ total_price ที่ส่งมาจากหน้า
                    details.plot_id
                ];
                break;

            case 'ค่าคนฉีดยาฆ่าหญ้า':
                const sprayingTotalPrice = details.price_per_can * details.number_of_cans;
                detailQuery = `
                    INSERT INTO WeedSpraying (expense_id,  number_of_cans, price_per_can, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    
                    details.number_of_cans,
                    details.price_per_can,
                    sprayingTotalPrice,  // ใช้ total_price ที่ส่งมาจากหน้า
                    details.plot_id
                ];
                break;

            case 'ค่าคนฉีดยาฮอโมน':
                const hormoneSprayingTotalPrice = details.price_per_can * details.number_of_cans;
                detailQuery = `
                    INSERT INTO HormoneSpraying (expense_id, number_of_cans, price_per_can, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    
                    details.number_of_cans,
                    details.price_per_can,
                    hormoneSprayingTotalPrice,  // ใช้ total_price ที่ส่งมาจากหน้า
                    details.plot_id
                ];
                break;

            default:
                return res.status(400).json({ error: 'ประเภทข้อมูลไม่ถูกต้อง' });
        }

        // เพิ่มข้อมูลในตารางที่เกี่ยวข้อง
        db.query(detailQuery, params, (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'เพิ่มข้อมูลสำเร็จ', expenseId });
        });
    });
};
// ฟังก์ชันสำหรับแก้ไขข้อมูลค่าใช้จ่าย
exports.deleteExpense = async (req, res) => {
    const expenseId = req.params.expense_id;

    if (!expenseId) {
        return res.status(400).json({ message: 'กรุณาระบุ expense_id' });
    }

    const query = 'UPDATE expenses SET is_deleted = 1 WHERE expense_id = ?';
    try {
        const result = await new Promise((resolve, reject) => {
            db.query(query, [expenseId], (err, results) => {
                if (err) {
                    console.error('ข้อผิดพลาดในการ query ข้อมูลจากฐานข้อมูล:', err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        if (result.affectedRows === 0) {
            // ไม่มีข้อมูลที่ตรงกับ expense_id
            return res.status(404).json({ message: 'ไม่พบข้อมูลค่าใช้จ่ายที่ต้องการลบ' });
        }

        res.json({ message: 'ข้อมูลค่าใช้จ่ายถูกตั้งค่าเป็นลบสำเร็จ' });
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการทำงานกับฐานข้อมูล:', err.stack);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดตข้อมูลค่าใช้จ่าย' });
    }
};
exports.getDeopdowplot = async (req, res) => {
    const userId = req.query.user_id;

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    const query = 'SELECT plot_id  , plot_name  FROM plots WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแปลง' });
        }

        res.json(results);
    });
}

exports.getExpenseEdit = async (req, res) => {
    const expenseId = req.query.expense_id;
    console.log('Expense ID:', expenseId);

    // ตรวจสอบว่ามีการส่ง expense_id มาหรือไม่
    if (!expenseId) {
        return res.status(400).json({ message: 'กรุณาระบุ expense_id' });
    }

    // ดึง category ของค่าใช้จ่ายนี้ก่อน
    const categoryQuery = `SELECT category FROM expenses WHERE expense_id = ? AND is_deleted = 0`;

    db.query(categoryQuery, [expenseId], (err, categoryResult) => {
        if (err) {
            console.error('Error fetching category:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภท' });
        }

        if (categoryResult.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลค่าใช้จ่าย' });
        }

        const category = categoryResult[0].category;
        let detailQuery = '';

        // กำหนด Query ตามประเภทค่าใช้จ่าย
        const expenseQueries = {
            'ค่าฮอร์โมน': `
                SELECT e.*, h.brand, h.volume, h.price_per_bottle, h.quantity, h.total_price, h.plot_id, h.purchase_location
                FROM expenses e
                LEFT JOIN HormoneData h ON e.expense_id = h.expense_id
                WHERE e.expense_id = ?`,

            'ค่าปุ๋ย': `
                SELECT e.*, f.brand, f.formula, f.price_per_bag, f.quantity, f.total_price, f.plot_id, f.purchase_location
                FROM expenses e
                LEFT JOIN FertilizerData f ON e.expense_id = f.expense_id
                WHERE e.expense_id = ?`,

            'ค่ายาฆ่าหญ้า': `
                SELECT e.*, he.brand, he.volume, he.price_per_bottle, he.quantity, he.total_price, he.plot_id, he.purchase_location
                FROM expenses e
                LEFT JOIN HerbicideData he ON e.expense_id = he.expense_id
                WHERE e.expense_id = ?`,

            'ค่าน้ำมัน': `
                SELECT e.*, fu.price_per_liter, fu.quantity_liters, fu.total_price, fu.plot_id
                FROM expenses e
                LEFT JOIN FuelData fu ON e.expense_id = fu.expense_id
                WHERE e.expense_id = ?`,

            'ค่าพันธุ์มัน': `
                SELECT e.*, cv.variety_name, cv.quantity, cv.price_per_tree, cv.total_price, cv.plot_id, cv.purchase_location
                FROM expenses e
                LEFT JOIN CassavaVarietyData cv ON e.expense_id = cv.expense_id
                WHERE e.expense_id = ?`,

            'ค่าซ่อมอุปกรณ์': `
                SELECT e.*, er.repair_names, er.details, er.repair_cost, er.shop_name
                FROM expenses e
                LEFT JOIN EquipmentRepairData er ON e.expense_id = er.expense_id
                WHERE e.expense_id = ?`,

            'ค่าอุปกรณ์': `
                SELECT e.*, ep.item_name, ep.shop_name, ep.purchase_price, ep.descript
                FROM expenses e
                LEFT JOIN EquipmentPurchaseData ep ON e.expense_id = ep.expense_id
                WHERE e.expense_id = ?`,

            'ค่าเช่าที่ดิน': `
                SELECT e.*, l.owner_name, l.owner_phone, l.area, l.price_per_rai, l.rental_period, l.total_price, l.plot_id
                FROM expenses e
                LEFT JOIN LandRentalData l ON e.expense_id = l.expense_id
                WHERE e.expense_id = ?`,

            'ค่าขุด': `
                SELECT e.*, ex.weight, ex.price_per_ton, ex.total_price, ex.plot_id
                FROM expenses e
                LEFT JOIN ExcavationData ex ON e.expense_id = ex.expense_id
                WHERE e.expense_id = ?`,

            'ค่าคนตัดต้น': `
                SELECT e.*, tc.number_of_trees, tc.price_per_tree, tc.total_price, tc.plot_id
                FROM expenses e
                LEFT JOIN TreeCutting tc ON e.expense_id = tc.expense_id
                WHERE e.expense_id = ?`,

            'ค่าคนปลูก': `
                SELECT e.*, pl.worker_name, pl.land_area, pl.price_per_rai, pl.total_price, pl.plot_id
                FROM expenses e
                LEFT JOIN Planting pl ON e.expense_id = pl.expense_id
                WHERE e.expense_id = ?`,

            'ค่าคนฉีดยาฆ่าหญ้า': `
                SELECT e.*, ws.number_of_cans, ws.price_per_can, ws.total_price, ws.plot_id
                FROM expenses e
                LEFT JOIN WeedSpraying ws ON e.expense_id = ws.expense_id
                WHERE e.expense_id = ?`,

            'ค่าคนฉีดยาฮอโมน': `
                SELECT e.*, hs.number_of_cans, hs.price_per_can, hs.total_price, hs.plot_id
                FROM expenses e
                LEFT JOIN HormoneSpraying hs ON e.expense_id = hs.expense_id
                WHERE e.expense_id = ?`
        };

        // ตรวจสอบว่ามี Query ตรงกับ category หรือไม่
        if (!expenseQueries[category]) {
            return res.status(400).json({ message: 'ไม่สามารถดึงข้อมูลประเภทนี้ได้' });
        }

        detailQuery = expenseQueries[category];

        // ดึงข้อมูลค่าใช้จ่ายพร้อมรายละเอียด
        db.query(detailQuery, [expenseId], (err, results) => {
            if (err) {
                console.error('Error executing query:', err.stack);
                return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย' });
            }

            // ตรวจสอบว่าพบข้อมูลหรือไม่
            if (results.length === 0) {
                return res.status(404).json({ message: 'ไม่พบข้อมูลค่าใช้จ่าย' });
            }

            // ✅ เปลี่ยน expense_date เป็น expenses_date และแปลงวันที่
            const formattedResult = {
                ...results[0],
                expenses_date: results[0].expenses_date
                    ? new Date(results[0].expenses_date).toISOString().split('T')[0]
                    : null // ตรวจสอบค่าว่างก่อนแปลง
            };

            // ส่งผลลัพธ์กลับไปในรูปแบบ JSON
            res.json(formattedResult);
        });
    });
};

exports.updateExpense = async (req, res) => {
    const expenseId = req.body.expense_id;
    const category = req.body.category;

    console.log('🔄 Updating Expense ID:', expenseId);
    console.log('📂 Category:', category);

    if (!expenseId || !category) {
        return res.status(400).json({ message: 'กรุณาระบุ expense_id และ category' });
    }

    // ข้อมูลที่อัปเดตในตาราง expenses
    const commonFields = {
        expenses_date: req.body.expenses_date,
    };

    const updateExpenseQuery = `UPDATE expenses SET ? WHERE expense_id = ? AND is_deleted = 0`;

    db.query(updateExpenseQuery, [commonFields, expenseId], (err, result) => {
        if (err) {
            console.error('❌ Error updating expense:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตค่าใช้จ่าย' });
        }

        console.log('✅ Expense updated successfully');

        // ตรวจสอบประเภทค่าใช้จ่ายและกำหนด SQL ที่ใช้สำหรับอัปเดตข้อมูล
        const expenseDetails = {
            'ค่าฮอร์โมน': {
                query: `
                UPDATE HormoneData 
                SET brand = ?, volume = ?, price_per_bottle = ?, quantity = ?, total_price = ?, purchase_location = ?, plot_id = ? 
                WHERE expense_id = ?`,
                values: [req.body.brand, req.body.volume, req.body.price_per_bottle, req.body.quantity, req.body.total_price, req.body.purchase_location, req.body.plot_id, expenseId]
            },
            'ค่าปุ๋ย': {
                query: `
                UPDATE FertilizerData 
                SET brand = ?, formula = ?, price_per_bag = ?, quantity = ?, total_price = ?, purchase_location = ?, plot_id = ? 
                WHERE expense_id = ?`,
                values: [req.body.brand, req.body.formula, req.body.price_per_bag, req.body.quantity, req.body.total_price, req.body.purchase_location, req.body.plot_id, expenseId]
            },
            'ค่ายาฆ่าหญ้า': {
                query: `
                UPDATE HerbicideData 
                SET brand = ?, volume = ?, price_per_bottle = ?, quantity = ?, total_price = ?, purchase_location = ?, plot_id = ? 
                WHERE expense_id = ?`,
                values: [req.body.brand, req.body.volume, req.body.price_per_bottle, req.body.quantity, req.body.total_price, req.body.purchase_location, req.body.plot_id, expenseId]
            },
            'ค่าน้ำมัน': {
                query: `
                UPDATE FuelData 
                SET price_per_liter = ?, quantity_liters = ?, total_price = ?, plot_id = ? 
                WHERE expense_id = ?`,
                values: [req.body.price_per_liter, req.body.quantity_liters, req.body.total_price, req.body.plot_id, expenseId]
            },
            'ค่าพันธุ์มัน': {
                query: `
                UPDATE CassavaVarietyData 
                SET variety_name = ?, quantity = ?, price_per_tree = ?, total_price = ?, purchase_location = ?, plot_id = ? 
                WHERE expense_id = ?`,
                values: [req.body.variety_name, req.body.quantity, req.body.price_per_tree, req.body.total_price, req.body.purchase_location, req.body.plot_id, expenseId]
            },
            'ค่าซ่อมอุปกรณ์': {
                query: `
                UPDATE EquipmentRepairData 
                SET repair_names = ?, details = ?, repair_cost = ?, shop_name = ? 
                WHERE expense_id = ?`,
                values: [req.body.repair_names, req.body.details, req.body.repair_cost, req.body.shop_name, expenseId]
            },
            'ค่าอุปกรณ์': {
                query: `
                UPDATE EquipmentPurchaseData 
                SET item_name = ?, shop_name = ?, purchase_price = ?, descript = ?, total_price = ? 
                WHERE expense_id = ?`,
                values: [req.body.item_name, req.body.shop_name, req.body.purchase_price, req.body.descript, req.body.total_price, expenseId]
            },
            'ค่าเช่าที่ดิน': {
                query: `
                UPDATE LandRentalData 
                SET owner_name = ?, owner_phone = ?, area = ?, price_per_rai = ?, rental_period = ?, total_price = ?, plot_id = ? 
                WHERE expense_id = ?`,
                values: [req.body.owner_name, req.body.owner_phone, req.body.area, req.body.price_per_rai, req.body.rental_period, req.body.total_price, req.body.plot_id, expenseId]
            },
            'ค่าขุด': {
                query: `
                UPDATE ExcavationData 
                SET weight = ?, price_per_ton = ?, total_price = ?, plot_id = ? 
                WHERE expense_id = ?`,
                values: [req.body.weight, req.body.price_per_ton, req.body.total_price, req.body.plot_id, expenseId]
            },
            'ค่าคนตัดต้น': {
                query: `
                UPDATE TreeCutting 
                SET number_of_trees = ?, price_per_tree = ?, total_price = ?, plot_id = ? 
                WHERE expense_id = ?`,
                values: [req.body.number_of_trees, req.body.price_per_tree, req.body.total_price, req.body.plot_id, expenseId]
            },
            'ค่าคนปลูก': {
                query: `
                UPDATE Planting 
                SET worker_name = ?, land_area = ?, price_per_rai = ?, total_price = ?, plot_id = ? 
                WHERE expense_id = ?`,
                values: [req.body.worker_name, req.body.land_area, req.body.price_per_rai, req.body.total_price, req.body.plot_id, expenseId]
            },
            'ค่าคนฉีดยาฆ่าหญ้า': {
                query: `
                UPDATE WeedSpraying 
                SET number_of_cans = ?, price_per_can = ?, total_price = ?, plot_id = ? 
                WHERE expense_id = ?`,
                values: [req.body.number_of_cans, req.body.price_per_can, req.body.total_price, req.body.plot_id, expenseId]
            },
            'ค่าคนฉีดยาฮอร์โมน': {
                query: `
                UPDATE HormoneSpraying 
                SET number_of_cans = ?, price_per_can = ?, total_price = ?, plot_id = ? 
                WHERE expense_id = ?`,
                values: [req.body.number_of_cans, req.body.price_per_can, req.body.total_price, req.body.plot_id, expenseId]
            }
        };

        // ตรวจสอบว่ามี query สำหรับประเภทค่าใช้จ่ายนี้หรือไม่
        if (!expenseDetails[category]) {
            return res.status(400).json({ message: 'ไม่สามารถอัปเดตข้อมูลประเภทนี้ได้' });
        }

        const { query, values } = expenseDetails[category];

        db.query(query, values, (err, detailResult) => {
            if (err) {
                console.error('❌ Error updating expense details:', err.stack);
                return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตรายละเอียดค่าใช้จ่าย' });
            }

            console.log('✅ Expense details updated successfully');
            res.json({ message: 'อัปเดตค่าใช้จ่ายเรียบร้อยแล้ว' });
        });
    });
};


