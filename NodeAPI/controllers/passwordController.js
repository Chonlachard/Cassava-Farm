const db = require('../config/db'); // ใช้ db สำหรับเชื่อมต่อฐานข้อมูล
const nodemailer = require("nodemailer");
const cron = require('node-cron');
const bcrypt = require('bcrypt');
const saltRounds = 10;




// สร้าง OTP แบบสุ่ม 6 หลัก
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ตั้งค่าการเชื่อมต่อ Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: 'ice2561pbza@gmail.com',  // อีเมลที่ใช้ส่ง
      pass: 'rdbf xnlg jgmt kwxf',         // รหัสผ่านอีเมล
    },
});

exports.changePassword = async (req, res) => {
  const { email, newPassword } = req.body;

  // ตรวจสอบว่า email และ newPassword ถูกส่งมาหรือไม่
  if (!email || !newPassword) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ตรวจสอบว่า email นี้มีอยู่ในฐานข้อมูล
    const result = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    // ตรวจสอบว่า result มีข้อมูลผู้ใช้หรือไม่
    if (result.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้งานที่มี email นี้' });
    }

    // อัปเดตรหัสผ่านใหม่ในฐานข้อมูล
    await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // ส่งข้อความตอบกลับสำเร็จ
    res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
  }
};

// ฟังก์ชันสำหรับส่ง OTP
exports.sendOTP = (req, res) => {
    const { email } = req.body;
  
    // ตรวจสอบว่ามีผู้ใช้ที่อีเมลนี้หรือไม่
    db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
      if (error) {
        return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล", error });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: "ไม่พบผู้ใช้ที่มีอีเมลนี้" });
      }
  
      // สร้าง OTP และตั้งค่าเวลาหมดอายุ (5 นาที)
      const otp = generateOTP();
      const otpExpire = new Date(Date.now() + 300000); // หมดอายุใน 5 นาที
  
      // บันทึก OTP และเวลาหมดอายุในฐานข้อมูล
      db.query('UPDATE users SET otp = ?, otpExpire = ? WHERE email = ?', [otp, otpExpire, email], (error) => {
        if (error) {
          return res.status(500).json({ message: "ไม่สามารถบันทึก OTP ในฐานข้อมูลได้", error });
        }
  
        // ตั้งค่าอีเมลที่จะส่ง
        const mailOptions = {
          from: '63020629@up.ac.th',
          to: email,
          subject: "รหัส OTP สำหรับรีเซ็ตรหัสผ่าน",
          html: `<p style="color: #666; text-align: center;">สวัสดี, <a href="mailto:${email}" style="color: #0366d6; text-decoration: none;">${email}</a></p>

                <p style="color: #666; text-align: center;">คุณได้ขอรีเซ็ตรหัสผ่านของคุณ กรุณาใช้รหัส OTP ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:</p>

                <div style="text-align: center; margin: 20px 0;">
                    <span style="background-color: #0095ff; color: white; padding: 8px 30px; font-size: 24px; border-radius: 4px;">${otp}</span>
                </div>

                <p style="color: #666; text-align: center;">หากคุณไม่ได้ทำการร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้</p>`,
        };
  
        // ส่งอีเมล OTP
        transporter.sendMail(mailOptions, (error) => {
          if (error) {
            return res.status(500).json({ message: "ไม่สามารถส่งอีเมลได้", error });
          }
          res.json({ message: "OTP ได้ถูกส่งไปยังอีเมลของคุณแล้ว" });
        });
      });
    });
};

// ฟังก์ชันตรวจสอบ OTP
exports.verifyOTP = (req, res) => {
    const { email, otp } = req.body;
  
    db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
      if (error) {
        return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล", error });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: "ไม่พบผู้ใช้ที่มีอีเมลนี้" });
      }
  
      const user = results[0];
  
      // ตรวจสอบว่า OTP ถูกต้องหรือไม่
      if (user.otp !== otp) {
        return res.status(400).json({ message: "OTP ไม่ถูกต้อง" });
      }
  
      // ตรวจสอบว่า OTP หมดอายุหรือไม่
      if (user.otpExpire < new Date()) {
        // รีเซ็ต OTP เป็น 0 หากหมดอายุ
        db.query('UPDATE users SET otp = ?, otpExpire = ? WHERE email = ?', ['0', null, email], (error) => {
          if (error) {
            return res.status(500).json({ message: "ไม่สามารถรีเซ็ต OTP ในฐานข้อมูลได้", error });
          }
          return res.status(400).json({ message: "OTP หมดอายุแล้ว" });
        });
      } else {
        // หาก OTP ถูกต้อง
        db.query('UPDATE users SET otp = ?, otpExpire = ? WHERE email = ?', ['0', null, email], (error) => {
          if (error) {
            return res.status(500).json({ message: "ไม่สามารถรีเซ็ต OTP ในฐานข้อมูลได้", error });
          }
          res.json({ message: "OTP ถูกต้อง กรุณาตั้งรหัสผ่านใหม่" });
        });
      }
    });
};

// ฟังก์ชันสำหรับส่ง OTP ซ้ำ
exports.resendOTP = (req, res) => {
  const { email } = req.body;

  // ตรวจสอบว่า email ถูกส่งมาหรือไม่
  if (!email) {
    return res.status(400).json({ message: "กรุณาระบุอีเมล" });
  }

  // ตรวจสอบว่าอีเมลนี้มีในฐานข้อมูลหรือไม่
  db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล", error });
    }

    // หากไม่พบผู้ใช้
    if (results.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้ที่มีอีเมลนี้" });
    }

    // สร้าง OTP ใหม่ และตั้งค่าเวลาหมดอายุ (5 นาที)
    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 300000); // หมดอายุใน 5 นาที

    // บันทึก OTP และเวลาหมดอายุในฐานข้อมูล
    db.query('UPDATE users SET otp = ?, otpExpire = ? WHERE email = ?', [otp, otpExpire, email], (error) => {
      if (error) {
        return res.status(500).json({ message: "ไม่สามารถบันทึก OTP ในฐานข้อมูลได้", error });
      }

      // ส่ง OTP ไปที่อีเมล
      const mailOptions = {
        from: '63020629@up.ac.th',
        to: email,
        subject: "รหัส OTP สำหรับรีเซ็ตรหัสผ่าน",
        html: `<p style="color: #666; text-align: center;">สวัสดี, <a href="mailto:${email}" style="color: #0366d6; text-decoration: none;">${email}</a></p>

              <p style="color: #666; text-align: center;">คุณได้ขอรีเซ็ตรหัสผ่านของคุณ กรุณาใช้รหัส OTP ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:</p>

              <div style="text-align: center; margin: 20px 0;">
                  <span style="background-color: #0095ff; color: white; padding: 8px 30px; font-size: 24px; border-radius: 4px;">${otp}</span>
              </div>

              <p style="color: #666; text-align: center;">หากคุณไม่ได้ทำการร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้</p>`,
      };

      // ส่งอีเมล OTP
      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          return res.status(500).json({ message: "ไม่สามารถส่งอีเมลได้", error });
        }
        res.json({ message: "OTP ถูกส่งไปที่อีเมลของคุณแล้ว" });
      });
    });
  });
};


// ตั้ง cron job ที่ทำงานทุกนาที
cron.schedule('* * * * *', () => {
    db.query('UPDATE users SET otp = ?, otpExpire = ? WHERE otpExpire < NOW()', ['0', null], (error) => {
      if (error) {

      } else {
   
      }
    });
});
