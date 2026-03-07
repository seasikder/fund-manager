import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const dbPath = path.join(__dirname, "fund.db");
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    profile_pic TEXT,
    role TEXT DEFAULT 'member',
    status TEXT DEFAULT 'pending',
    deactivation_request INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    month TEXT NOT NULL,
    method TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,
    user_id INTEGER,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS slider_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Data Reset Logic (Run once if requested)
// To reset data, uncomment the lines below and restart the server once.
/*
db.exec(`
  DELETE FROM payments;
  DELETE FROM transactions;
  DELETE FROM slider_images;
  DELETE FROM settings;
  DELETE FROM users WHERE role != 'admin';
  DELETE FROM sqlite_sequence WHERE name IN ('payments', 'transactions', 'slider_images', 'users');
`);
*/

// Migration: Add status and deactivation_request to users if they don't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN deactivation_request INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
} catch (e) {}

// Seed initial settings if not exists
const seedSettings = [
  { key: 'bkash_number', value: '017XXXXXXXX' },
  { key: 'nagad_number', value: '018XXXXXXXX' },
  { key: 'admin_phone', value: '01700000000' },
  { key: 'admin_name', value: 'Admin' },
  { key: 'admin_profile_pic', value: '' }
];

seedSettings.forEach(s => {
  const exists = db.prepare("SELECT * FROM settings WHERE key = ?").get(s.key);
  if (!exists) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(s.key, s.value);
  }
});

// Seed initial slider images if empty
const imagesCount = db.prepare("SELECT COUNT(*) as count FROM slider_images").get() as { count: number };
if (imagesCount.count === 0) {
  db.prepare("INSERT INTO slider_images (url) VALUES (?)").run("https://picsum.photos/seed/temple1/1200/400");
  db.prepare("INSERT INTO slider_images (url) VALUES (?)").run("https://picsum.photos/seed/temple2/1200/400");
}

// Seed admin if not exists
const adminPhone = db.prepare("SELECT value FROM settings WHERE key = 'admin_phone'").get().value;
const admin = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!admin) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (name, phone, password, role, member_id, status) VALUES (?, ?, ?, ?, ?, ?)").run(
    "Admin",
    adminPhone,
    hashedPassword,
    "admin",
    "ADM-001",
    "active"
  );
} else {
  // Ensure existing admin is active
  db.prepare("UPDATE users SET status = 'active' WHERE role = 'admin'").run();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Settings API
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post("/api/admin/settings", (req, res) => {
    const { bkash_number, nagad_number, admin_phone, admin_name, admin_profile_pic } = req.body;
    if (bkash_number) db.prepare("UPDATE settings SET value = ? WHERE key = 'bkash_number'").run(bkash_number);
    if (nagad_number) db.prepare("UPDATE settings SET value = ? WHERE key = 'nagad_number'").run(nagad_number);
    if (admin_phone) {
      db.prepare("UPDATE settings SET value = ? WHERE key = 'admin_phone'").run(admin_phone);
      db.prepare("UPDATE users SET phone = ? WHERE role = 'admin'").run(admin_phone);
    }
    if (admin_name) {
      db.prepare("UPDATE settings SET value = ? WHERE key = 'admin_name'").run(admin_name);
      db.prepare("UPDATE users SET name = ? WHERE role = 'admin'").run(admin_name);
    }
    if (admin_profile_pic !== undefined) {
      db.prepare("UPDATE settings SET value = ? WHERE key = 'admin_profile_pic'").run(admin_profile_pic);
      db.prepare("UPDATE users SET profile_pic = ? WHERE role = 'admin'").run(admin_profile_pic);
    }
    res.json({ success: true });
  });

  // Slider Images API
  app.get("/api/slider-images", (req, res) => {
    const images = db.prepare("SELECT * FROM slider_images").all();
    res.json(images);
  });

  app.post("/api/admin/slider-images", (req, res) => {
    const { url } = req.body;
    db.prepare("INSERT INTO slider_images (url) VALUES (?)").run(url);
    res.json({ success: true });
  });

  app.delete("/api/admin/slider-images/:id", (req, res) => {
    db.prepare("DELETE FROM slider_images WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { phone, password } = req.body;
    // Support login via phone OR member_id
    const user = db.prepare("SELECT * FROM users WHERE phone = ? OR member_id = ?").get(phone, phone);
    if (user && bcrypt.compareSync(password, user.password)) {
      if (user.role !== 'admin' && user.status !== 'active') {
        return res.status(403).json({ success: false, message: "আপনার একাউন্টটি এখনো একটিভ করা হয়নি। দয়া করে এডমিনের অনুমোদনের জন্য অপেক্ষা করুন।" });
      }
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "ভুল ফোন নম্বর বা পাসওয়ার্ড" });
    }
  });

  app.post("/api/change-password", (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (user && bcrypt.compareSync(oldPassword, user.password)) {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, userId);
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "পুরানো পাসওয়ার্ড সঠিক নয়" });
    }
  });

  app.post("/api/reset-password-request", (req, res) => {
    const { phone } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
    if (user) {
      // In a real app, send SMS here. For now, just allow reset.
      res.json({ success: true, message: "ফোন নম্বরটি সঠিক। এখন নতুন পাসওয়ার্ড দিন।" });
    } else {
      res.status(404).json({ success: false, message: "এই ফোন নম্বরে কোনো একাউন্ট পাওয়া যায়নি" });
    }
  });

  app.post("/api/reset-password-confirm", (req, res) => {
    const { phone, newPassword } = req.body;
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE phone = ?").run(hashedPassword, phone);
    res.json({ success: true });
  });

  app.post("/api/register", (req, res) => {
    const { name, phone, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const count = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
      const memberId = `BS-${String(count.count + 1).padStart(3, '0')}`;
      const result = db.prepare("INSERT INTO users (name, phone, password, member_id) VALUES (?, ?, ?, ?)").run(name, phone, hashedPassword, memberId);
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ success: false, message: "ফোন নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে" });
    }
  });

  app.post("/api/user/update-profile", (req, res) => {
    const { userId, profilePic } = req.body;
    db.prepare("UPDATE users SET profile_pic = ? WHERE id = ?").run(profilePic, userId);
    res.json({ success: true });
  });

  app.post("/api/user/request-deactivation", (req, res) => {
    const { userId } = req.body;
    db.prepare("UPDATE users SET deactivation_request = 1 WHERE id = ?").run(userId);
    res.json({ success: true });
  });

  app.get("/api/admin/member-management", (req, res) => {
    const pending = db.prepare("SELECT id, name, phone, member_id, status FROM users WHERE status = 'pending' AND role = 'member'").all();
    const deactivationRequests = db.prepare("SELECT id, name, phone, member_id, status FROM users WHERE deactivation_request = 1 AND role = 'member'").all();
    const inactive = db.prepare("SELECT id, name, phone, member_id, status FROM users WHERE status = 'inactive' AND role = 'member'").all();
    res.json({ pending, deactivationRequests, inactive });
  });

  app.post("/api/admin/add-member", (req, res) => {
    const { name, phone, password, memberId } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare("INSERT INTO users (name, phone, password, member_id, status) VALUES (?, ?, ?, ?, ?)").run(
        name, phone, hashedPassword, memberId, 'active'
      );
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ success: false, message: "ফোন নম্বর বা সদস্য আইডি ইতিমধ্যে ব্যবহৃত হয়েছে" });
    }
  });

  app.post("/api/admin/approve-member", (req, res) => {
    const { userId } = req.body;
    db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(userId);
    res.json({ success: true });
  });

  app.post("/api/admin/deactivate-member", (req, res) => {
    const { userId } = req.body;
    // Only allow deactivation if there is a request
    const user = db.prepare("SELECT deactivation_request FROM users WHERE id = ?").get(userId);
    if (user && user.deactivation_request === 1) {
      db.prepare("UPDATE users SET status = 'inactive', deactivation_request = 0 WHERE id = ?").run(userId);
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "সদস্য ডিঅ্যাক্টিভেশনের জন্য কোনো প্রস্তাব পাঠাননি।" });
    }
  });

  app.get("/api/fund-balance", (req, res) => {
    const totalPayments = db.prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'approved'").get() as { total: number };
    const totalTransactions = db.prepare("SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total FROM transactions WHERE status = 'approved'").get() as { total: number };
    const balance = (totalPayments.total || 0) + (totalTransactions.total || 0);
    res.json({ balance });
  });

  // Income/Expense Transactions API
  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, u.name as user_name, u.member_id 
      FROM transactions t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE t.status = 'approved'
      ORDER BY t.created_at DESC
    `).all();
    res.json(transactions);
  });

  app.get("/api/admin/transactions", (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, u.name as user_name, u.member_id 
      FROM transactions t 
      LEFT JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
    `).all();
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { type, description, amount, userId } = req.body;
    db.prepare("INSERT INTO transactions (type, description, amount, user_id) VALUES (?, ?, ?, ?)").run(
      type, description, amount, userId
    );
    res.json({ success: true });
  });

  app.post("/api/admin/approve-transaction", (req, res) => {
    const { id, status } = req.body;
    db.prepare("UPDATE transactions SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  // Member Search API
  app.get("/api/admin/member-search/:memberId", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE member_id = ?").get(req.params.memberId);
    if (!user) return res.status(404).json({ message: "সদস্য পাওয়া যায়নি" });
    
    const payments = db.prepare("SELECT * FROM payments WHERE user_id = ?").all(user.id);
    const contributions = db.prepare("SELECT * FROM transactions WHERE user_id = ?").all(user.id);
    
    res.json({ user, payments, contributions });
  });

  // Member Routes
  app.get("/api/payments/:userId", (req, res) => {
    const payments = db.prepare("SELECT * FROM payments WHERE user_id = ? ORDER BY month DESC").all(req.params.userId);
    res.json(payments);
  });

  app.post("/api/payments", (req, res) => {
    const { userId, amount, month, method, transactionId } = req.body;
    db.prepare("INSERT INTO payments (user_id, amount, month, method, transaction_id) VALUES (?, ?, ?, ?, ?)").run(
      userId,
      amount,
      month,
      method,
      transactionId
    );
    res.json({ success: true });
  });

  // Admin Routes
  app.post("/api/admin/sync-to-cloud", async (req, res) => {
    if (!supabase) {
      return res.status(400).json({ success: false, message: "Supabase keys are not configured in environment variables." });
    }

    try {
      const users = db.prepare("SELECT * FROM users").all();
      const payments = db.prepare("SELECT * FROM payments").all();
      const transactions = db.prepare("SELECT * FROM transactions").all();
      const settings = db.prepare("SELECT * FROM settings").all();
      const slider_images = db.prepare("SELECT * FROM slider_images").all();

      // Sync logic: Upsert data to Supabase
      // Note: This assumes tables exist in Supabase with same schema
      if (users.length > 0) await supabase.from('users').upsert(users);
      if (payments.length > 0) await supabase.from('payments').upsert(payments);
      if (transactions.length > 0) await supabase.from('transactions').upsert(transactions);
      if (settings.length > 0) await supabase.from('settings').upsert(settings);
      if (slider_images.length > 0) await supabase.from('slider_images').upsert(slider_images);

      res.json({ success: true, message: "Data successfully synced to Supabase Cloud!" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/admin/backup", (req, res) => {
    const users = db.prepare("SELECT * FROM users").all();
    const payments = db.prepare("SELECT * FROM payments").all();
    const transactions = db.prepare("SELECT * FROM transactions").all();
    const settings = db.prepare("SELECT * FROM settings").all();
    const slider_images = db.prepare("SELECT * FROM slider_images").all();
    
    res.json({
      backup_date: new Date().toISOString(),
      data: { users, payments, transactions, settings, slider_images }
    });
  });

  app.get("/api/admin/members", (req, res) => {
    const members = db.prepare("SELECT id, name, phone, member_id FROM users WHERE role = 'member'").all();
    res.json(members);
  });

  app.get("/api/admin/all-payments", (req, res) => {
    const payments = db.prepare(`
      SELECT p.*, u.name as user_name, u.phone as user_phone 
      FROM payments p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `).all();
    res.json(payments);
  });

  app.post("/api/admin/approve-payment", (req, res) => {
    const { paymentId, status } = req.body;
    db.prepare("UPDATE payments SET status = ? WHERE id = ?").run(status, paymentId);
    res.json({ success: true });
  });

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        allowedHosts: true
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
