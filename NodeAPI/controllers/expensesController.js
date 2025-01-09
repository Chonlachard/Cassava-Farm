const moment = require('moment');
const db = require('../config/db'); // ใช้ db สำหรับเชื่อมต่อฐานข้อมูล

// ฟังก์ชันสำหรับดึงข้อมูลค่าใช้จ่าย
exports.getExpense = async (req, res) => {
    const { user_id, startDate, endDate, plot_id, category } = req.query;

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!user_id) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    // เริ่มต้นคำสั่ง SQL
    let query = `SELECT a.expense_id, a.expense_date, b.plot_name, a.category, a.amount, a.details
                    FROM expenses a
                    LEFT JOIN plots b on a.plot_id = b.plot_id
                    WHERE a.user_id = ?`;

    // ตัวแปร values สำหรับกรอกพารามิเตอร์
    const values = [user_id];

    // การเพิ่มเงื่อนไขต่าง ๆ ใน SQL
    if (plot_id) {
        query += ' AND a.plot_id = ?';
        values.push(plot_id);
    }
    if (startDate) {
        query += ' AND a.expense_date >= ?';
        values.push(startDate); // ค่าของ startDate
    }
    if (endDate) {
        query += ' AND a.expense_date <= ?';
        values.push(endDate); // ค่าของ endDate
    }
    if (category) {
        query += ' AND a.category = ?';
        values.push(category); // ค่าของ category
    }

    query += ' ORDER BY a.expense_date DESC';  // การเรียงลำดับผลลัพธ์

    // การรันคำสั่ง SQL
    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย' });
        }

        // แปลงวันที่จาก yyyy-mm-dd เป็น dd-mm-yyyy
        const formattedResults = results.map(expense => ({
            ...expense,
            expense_date: moment(expense.expense_date).format('DD-MM-YYYY')  // ใช้ moment.js เพื่อจัดรูปแบบวันที่
        }));

        // ส่งผลลัพธ์กลับไปในรูปแบบ JSON
        res.json(formattedResults);
    });
};

// ฟังก์ชันสำหรับเพิ่มข้อมูลค่าใช้จ่าย
// ฟังก์ชันสำหรับเพิ่มข้อมูลค่าใช้จ่าย
exports.addExpense = async (req, res) => {
    const { user_id, category, details } = req.body;

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!user_id || !category || !details) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // เพิ่มข้อมูลลงในฐานข้อมูล Expenses
    const query = `INSERT INTO expenses (user_id, category) VALUES (?, ?)`;

    db.query(query, [user_id, category], (err, expenseResult) => {
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
                    INSERT INTO HormoneData (expense_id, brand, volume, price_per_bottle, quantity, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.brand,
                    details.volume,
                    details.price_per_bottle,
                    details.quantity,
                    hormoneTotalPrice,  // คำนวณ total_price
                    details.plot_id
                ];
                break;

            case 'ค่าปุ๋ย':
                const fertilizerTotalPrice = details.price_per_bag * details.quantity;
                detailQuery = `
                    INSERT INTO FertilizerData (expense_id, brand, formula, price_per_bag, quantity, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.brand,
                    details.formula,
                    details.price_per_bag,
                    details.quantity,
                    fertilizerTotalPrice,  // คำนวณ total_price
                    details.plot_id
                ];
                break;

            case 'ค่ายาฆ่าหญ่า':
                const herbicideTotalPrice = details.price_per_bottle * details.quantity;
                detailQuery = `
                    INSERT INTO HerbicideData (expense_id, brand, volume, price_per_bottle, quantity, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.brand,
                    details.volume,
                    details.price_per_bottle,
                    details.quantity,
                    herbicideTotalPrice,  // คำนวณ total_price
                    details.plot_id
                ];
                break;

            case 'ค่าน้ำมัน':
                const fuelTotalPrice = details.price_per_liter * details.quantity_liters;
                detailQuery = `
                    INSERT INTO FuelData (expense_id, fuel_date, price_per_liter, quantity_liters, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.fuel_date,
                    details.price_per_liter,
                    details.quantity_liters,
                    fuelTotalPrice,  // คำนวณ total_price
                    details.plot_id
                ];
                break;

            case 'ค่าพันธุ์มัน':
                const cassavaTotalPrice = details.price_per_tree * details.quantity;
                detailQuery = `
                    INSERT INTO CassavaVarietyData (expense_id, purchase_date, quantity, price_per_tree, total_price, plot_id, variety_name, purchase_location)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.purchase_date,
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
                    INSERT INTO EquipmentRepairData (expense_id, repair_date, repair_names, details, repair_cost, shop_name)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.repair_date,
                    details.repair_names,
                    details.details,
                    details.repair_cost,
                    details.shop_name
                ];
                break;

            case 'ค่าอุปกรณ์':
                detailQuery = `
                    INSERT INTO EquipmentPurchaseData (expense_id, purchase_date, item_name, shop_name, purchase_price, remarks)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.purchase_date,
                    details.item_name,
                    details.shop_name,
                    details.purchase_price,
                    details.remarks
                ];
                break;

            case 'ค่าเช่าที่ดิน':
                detailQuery = `
                    INSERT INTO LandRentalData (expense_id, rental_date, owner_name, owner_phone, area, price_per_rai, rental_period, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.rental_date,
                    details.owner_name,
                    details.owner_phone,
                    details.area,
                    details.price_per_rai,
                    details.rental_period,
                    details.total_price,  // ใช้ total_price ที่ส่งมาจากหน้า
                    details.plot_id
                ];
                break;

            case 'ค่าขุด':
                detailQuery = `
                    INSERT INTO ExcavationData (expense_id, payment_date, weight, price_per_ton, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.payment_date,
                    details.weight,
                    details.price_per_ton,
                    details.total_price,  // ใช้ total_price ที่ส่งมาจากหน้า
                    details.plot_id
                ];
                break;

            case 'ค่าคนตัดต้น':
                detailQuery = `
                    INSERT INTO TreeCutting (expense_id, cutting_date, number_of_trees, price_per_tree, total_price, bundle_count, plot_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.cutting_date,
                    details.number_of_trees,
                    details.price_per_tree,
                    details.total_price,  // ใช้ total_price ที่ส่งมาจากหน้า
                    details.bundle_count,
                    details.plot_id
                ];
                break;

            case 'ค่าคนปลูก':
                detailQuery = `
                    INSERT INTO Planting (expense_id, payment_date, worker_name, land_area, price_per_rai, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.payment_date,
                    details.worker_name,
                    details.land_area,
                    details.price_per_rai,
                    details.total_price,  // ใช้ total_price ที่ส่งมาจากหน้า
                    details.plot_id
                ];
                break;

            case 'ค่าคนฉีดยาฆ่าหญ่า':
                detailQuery = `
                    INSERT INTO WeedSpraying (expense_id, spray_date, number_of_cans, price_per_can, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.spray_date,
                    details.number_of_cans,
                    details.price_per_can,
                    details.total_price,  // ใช้ total_price ที่ส่งมาจากหน้า
                    details.plot_id
                ];
                break;

            case 'ค่าคนฉีดยาฮอโมน':
                detailQuery = `
                    INSERT INTO HormoneSpraying (expense_id, spray_date, number_of_cans, price_per_can, total_price, plot_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                params = [
                    expenseId,
                    details.spray_date,
                    details.number_of_cans,
                    details.price_per_can,
                    details.total_price,  // ใช้ total_price ที่ส่งมาจากหน้า
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

    const query = 'DELETE FROM expenses WHERE expense_id = ?';
    try {
        const result = await new Promise((resolve, reject) => {
            db.query(query, [expenseId], (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
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

        res.json({ message: 'ลบข้อมูลค่าใช้จ่ายสำเร็จ' });
    } catch (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลค่าใช้จ่าย' });
    }
};

exports.updateExpense = async (req, res) => {
    const { expense_id, user_id,plot_id, expense_date, category, amount, details } = req.body;

    try {
        // ตรวจสอบข้อมูลที่มีอยู่
        const [rows] = await db.promise().query('SELECT * FROM expenses WHERE expense_id = ?', [expense_id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลค่าใช้จ่าย' });
        }

        // อัพเดตข้อมูล
        await db.promise().query(
            `UPDATE expenses SET user_id = ?,plot_id = ?, expense_date = ?, category = ?, amount = ?, details = ? WHERE expense_id = ?`,
            [user_id,plot_id, expense_date, category, amount, details, expense_id]
        );

        res.status(200).json({ message: 'อัพเดตข้อมูลค่าใช้จ่ายสำเร็จ' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดตข้อมูลค่าใช้จ่าย', error });
    }
};

exports.getExpenseEdit = async (req, res) => {
    const expenseId = req.params.expense_id;

    // ตรวจสอบว่ามีการส่ง expense_id มาหรือไม่
    if (!expenseId) {
        return res.status(400).json({ message: 'กรุณาระบุ expense_id' });
    }

    const query = `SELECT a.expense_id, a.expense_date,b.plot_name , a.category ,a.amount , a.details
                    FROM expenses a
                    LEFT JOIN plots b on a.plot_id = b.plot_id
                    WHERE a.expense_id = ?`;
    db.query(query, [expenseId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย' });
        }

        // ตรวจสอบว่าพบข้อมูลหรือไม่
        if (results.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลค่าใช้จ่าย' });
        }

        // แปลงวันที่
        const formattedResult = {
            ...results[0],
            expense_date: moment(results[0].expense_date).format('YYYY-MM-DD')
        };

        // ส่งผลลัพธ์กลับไปในรูปแบบ JSON
        res.json(formattedResult);
    });
};

// ฟังก์ชันสำหรับดึงข้อมูลค่าใช้จ่ายตามช่วงวันที่
exports.getExpensesByDateRange = async (req, res) => {
    const userId = req.query.user_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    console.log(userId, startDate, endDate);

    // ตรวจสอบว่ามีการส่งข้อมูลที่จำเป็นมาหรือไม่
    if (!userId || !startDate || !endDate) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id, startDate, และ endDate' });
    }

    // ตรวจสอบรูปแบบของวันที่
    if (!moment(startDate, 'YYYY-MM-DD', true).isValid() || !moment(endDate, 'YYYY-MM-DD', true).isValid()) {
        return res.status(400).json({ message: 'รูปแบบวันที่ไม่ถูกต้อง' });
    }

    const query = `
        SELECT * FROM expenses 
        WHERE user_id = ? 
        AND expense_date BETWEEN ? AND ? 
        ORDER BY expense_date ASC`;

    db.query(query, [userId, startDate, endDate], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย' });
        }

        // แปลงวันที่ในผลลัพธ์ให้เป็นรูปแบบ dd-mm-yyyy
        const formattedResults = results.map(expense => {
            return {
                ...expense,
                expense_date: moment(expense.expense_date).format('DD-MM-YYYY') // แปลงรูปแบบวันที่
            };
        });

        res.json(formattedResults);
    });
};


exports.getDeopdowplot = async (req, res) => {
    const userId = req.query.user_id;

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    const query = 'SELECT plot_id , plot_name  FROM plots WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแปลง' });
        }

        res.json(results);
    });
}







