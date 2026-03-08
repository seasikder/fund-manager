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

if (supabaseUrl && supabaseKey) {
  console.log(`DATABASE: Attempting to connect to Supabase at ${supabaseUrl}`);
  if (!supabaseKey.includes('.')) {
    console.warn("DATABASE: WARNING: SUPABASE_SERVICE_ROLE_KEY does not look like a standard JWT. Connection might fail.");
  }
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to check if we should use Supabase
const useSupabase = () => !!supabase;

if (useSupabase()) {
  console.log("DATABASE: Connected to Supabase Cloud Storage.");
} else {
  console.log("DATABASE: Using local SQLite (fund.db). WARNING: Data will be lost on server restart if not using persistent storage.");
  if (!supabaseUrl || !supabaseKey) {
    console.log(`DATABASE: Missing env vars - URL: ${!!supabaseUrl}, Key: ${!!supabaseKey}`);
  }
}

const dbPath = path.join(__dirname, "fund.db");
const db = new Database(dbPath);

// Initialize SQLite database (Fallback)
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

// Note: For Supabase, you must create these tables manually in the Supabase SQL Editor.
// I will provide the SQL script in a separate file for you.

// Migration and Seed logic (SQLite only)
if (!useSupabase()) {
  try { db.prepare("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE users ADD COLUMN deactivation_request INTEGER DEFAULT 0").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP").run(); } catch (e) {}

  const seedSettings = [
    { key: 'bkash_number', value: '017XXXXXXXX' },
    { key: 'nagad_number', value: '018XXXXXXXX' },
    { key: 'admin_phone', value: '01700000000' },
    { key: 'admin_name', value: 'Admin' },
    { key: 'admin_profile_pic', value: '' }
  ];

  seedSettings.forEach(s => {
    const exists = db.prepare("SELECT * FROM settings WHERE key = ?").get(s.key);
    if (!exists) db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(s.key, s.value);
  });

  const imagesCount = db.prepare("SELECT COUNT(*) as count FROM slider_images").get() as { count: number };
  if (imagesCount.count === 0) {
    db.prepare("INSERT INTO slider_images (url) VALUES (?)").run("https://picsum.photos/seed/temple1/1200/400");
    db.prepare("INSERT INTO slider_images (url) VALUES (?)").run("https://picsum.photos/seed/temple2/1200/400");
  }

  const adminPhone = db.prepare("SELECT value FROM settings WHERE key = 'admin_phone'").get().value;
  const admin = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
  if (!admin) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    db.prepare("INSERT INTO users (name, phone, password, role, member_id, status) VALUES (?, ?, ?, ?, ?, ?)").run(
      "Admin", adminPhone, hashedPassword, "admin", "ADM-001", "active"
    );
  }
}

// DB Abstraction Layer
const dbService = {
  async getSettings() {
    if (useSupabase()) {
      const { data } = await supabase!.from('settings').select('*');
      return data?.reduce((acc: any, s: any) => { acc[s.key] = s.value; return acc; }, {}) || {};
    }
    const settings = db.prepare("SELECT * FROM settings").all();
    return settings.reduce((acc: any, s: any) => { acc[s.key] = s.value; return acc; }, {});
  },
  async updateSetting(key: string, value: string) {
    if (useSupabase()) {
      await supabase!.from('settings').upsert({ key, value });
    } else {
      db.prepare("UPDATE settings SET value = ? WHERE key = ?").run(value, key);
    }
  },
  async getSliderImages() {
    if (useSupabase()) {
      const { data } = await supabase!.from('slider_images').select('*').order('id');
      return data || [];
    }
    return db.prepare("SELECT * FROM slider_images").all();
  },
  async addSliderImage(url: string) {
    if (useSupabase()) {
      await supabase!.from('slider_images').insert({ url });
    } else {
      db.prepare("INSERT INTO slider_images (url) VALUES (?)").run(url);
    }
  },
  async deleteSliderImage(id: string) {
    if (useSupabase()) {
      await supabase!.from('slider_images').delete().eq('id', id);
    } else {
      db.prepare("DELETE FROM slider_images WHERE id = ?").run(id);
    }
  },
  async getUserByPhoneOrId(phone: string) {
    if (useSupabase()) {
      const { data } = await supabase!.from('users').select('*').or(`phone.eq.${phone},member_id.eq.${phone}`).single();
      return data;
    }
    return db.prepare("SELECT * FROM users WHERE phone = ? OR member_id = ?").get(phone, phone);
  },
  async getUserById(id: number) {
    if (useSupabase()) {
      const { data } = await supabase!.from('users').select('*').eq('id', id).single();
      return data;
    }
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  },
  async updateUserPassword(userId: number, hashedPassword: string) {
    if (useSupabase()) {
      await supabase!.from('users').update({ password: hashedPassword }).eq('id', userId);
    } else {
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, userId);
    }
  },
  async resetUserPassword(phone: string, hashedPassword: string) {
    if (useSupabase()) {
      await supabase!.from('users').update({ password: hashedPassword }).eq('phone', phone);
    } else {
      db.prepare("UPDATE users SET password = ? WHERE phone = ?").run(hashedPassword, phone);
    }
  },
  async registerUser(name: string, phone: string, hashedPassword: string, memberId: string) {
    if (useSupabase()) {
      const { data, error } = await supabase!.from('users').insert({ name, phone, password: hashedPassword, member_id: memberId }).select().single();
      if (error) throw error;
      return data.id;
    }
    const result = db.prepare("INSERT INTO users (name, phone, password, member_id) VALUES (?, ?, ?, ?)").run(name, phone, hashedPassword, memberId);
    return result.lastInsertRowid;
  },
  async getUsersCount() {
    if (useSupabase()) {
      const { count } = await supabase!.from('users').select('*', { count: 'exact', head: true });
      return count || 0;
    }
    const count = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    return count.count;
  },
  async updateUserProfilePic(userId: number, profilePic: string) {
    if (useSupabase()) {
      await supabase!.from('users').update({ profile_pic: profilePic }).eq('id', userId);
    } else {
      db.prepare("UPDATE users SET profile_pic = ? WHERE id = ?").run(profilePic, userId);
    }
  },
  async requestDeactivation(userId: number) {
    if (useSupabase()) {
      await supabase!.from('users').update({ deactivation_request: 1 }).eq('id', userId);
    } else {
      db.prepare("UPDATE users SET deactivation_request = 1 WHERE id = ?").run(userId);
    }
  },
  async getMemberManagement() {
    if (useSupabase()) {
      const { data: pending } = await supabase!.from('users').select('id, name, phone, member_id, status').eq('status', 'pending').eq('role', 'member');
      const { data: deactivationRequests } = await supabase!.from('users').select('id, name, phone, member_id, status').eq('deactivation_request', 1).eq('role', 'member');
      const { data: inactive } = await supabase!.from('users').select('id, name, phone, member_id, status').eq('status', 'inactive').eq('role', 'member');
      return { pending: pending || [], deactivationRequests: deactivationRequests || [], inactive: inactive || [] };
    }
    const pending = db.prepare("SELECT id, name, phone, member_id, status FROM users WHERE status = 'pending' AND role = 'member'").all();
    const deactivationRequests = db.prepare("SELECT id, name, phone, member_id, status FROM users WHERE deactivation_request = 1 AND role = 'member'").all();
    const inactive = db.prepare("SELECT id, name, phone, member_id, status FROM users WHERE status = 'inactive' AND role = 'member'").all();
    return { pending, deactivationRequests, inactive };
  },
  async addMember(name: string, phone: string, hashedPassword: string, memberId: string) {
    if (useSupabase()) {
      await supabase!.from('users').insert({ name, phone, password: hashedPassword, member_id: memberId, status: 'active' });
    } else {
      db.prepare("INSERT INTO users (name, phone, password, member_id, status) VALUES (?, ?, ?, ?, ?)").run(name, phone, hashedPassword, memberId, 'active');
    }
  },
  async approveMember(userId: number) {
    if (useSupabase()) {
      await supabase!.from('users').update({ status: 'active' }).eq('id', userId);
    } else {
      db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(userId);
    }
  },
  async deactivateMember(userId: number) {
    if (useSupabase()) {
      await supabase!.from('users').update({ status: 'inactive', deactivation_request: 0 }).eq('id', userId);
    } else {
      db.prepare("UPDATE users SET status = 'inactive', deactivation_request = 0 WHERE id = ?").run(userId);
    }
  },
  async getFundBalance() {
    if (useSupabase()) {
      const { data: pData } = await supabase!.from('payments').select('amount').eq('status', 'approved');
      const { data: tData } = await supabase!.from('transactions').select('amount, type').eq('status', 'approved');
      const totalPayments = pData?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalTransactions = tData?.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0) || 0;
      return totalPayments + totalTransactions;
    }
    const totalPayments = db.prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'approved'").get() as { total: number };
    const totalTransactions = db.prepare("SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total FROM transactions WHERE status = 'approved'").get() as { total: number };
    return (totalPayments.total || 0) + (totalTransactions.total || 0);
  },
  async getTransactions(approvedOnly = true) {
    if (useSupabase()) {
      let query = supabase!.from('transactions').select('*, users(name, member_id)');
      if (approvedOnly) query = query.eq('status', 'approved');
      const { data } = await query.order('created_at', { ascending: false });
      return data?.map((t: any) => ({ ...t, user_name: t.users?.name, member_id: t.users?.member_id })) || [];
    }
    const sql = approvedOnly 
      ? "SELECT t.*, u.name as user_name, u.member_id FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE t.status = 'approved' ORDER BY t.created_at DESC"
      : "SELECT t.*, u.name as user_name, u.member_id FROM transactions t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC";
    return db.prepare(sql).all();
  },
  async addTransaction(type: string, description: string, amount: number, userId: number) {
    if (useSupabase()) {
      await supabase!.from('transactions').insert({ type, description, amount, user_id: userId });
    } else {
      db.prepare("INSERT INTO transactions (type, description, amount, user_id) VALUES (?, ?, ?, ?)").run(type, description, amount, userId);
    }
  },
  async approveTransaction(id: number, status: string) {
    if (useSupabase()) {
      await supabase!.from('transactions').update({ status }).eq('id', id);
    } else {
      db.prepare("UPDATE transactions SET status = ? WHERE id = ?").run(status, id);
    }
  },
  async getMemberDetails(memberId: string) {
    if (useSupabase()) {
      const { data: user } = await supabase!.from('users').select('*').eq('member_id', memberId).single();
      if (!user) return null;
      const { data: payments } = await supabase!.from('payments').select('*').eq('user_id', user.id);
      const { data: contributions } = await supabase!.from('transactions').select('*').eq('user_id', user.id);
      return { user, payments: payments || [], contributions: contributions || [] };
    }
    const user = db.prepare("SELECT * FROM users WHERE member_id = ?").get(memberId);
    if (!user) return null;
    const payments = db.prepare("SELECT * FROM payments WHERE user_id = ?").all(user.id);
    const contributions = db.prepare("SELECT * FROM transactions WHERE user_id = ?").all(user.id);
    return { user, payments, contributions };
  },
  async getPaymentsByUserId(userId: string) {
    if (useSupabase()) {
      const { data } = await supabase!.from('payments').select('*').eq('user_id', userId).order('month', { ascending: false });
      return data || [];
    }
    return db.prepare("SELECT * FROM payments WHERE user_id = ? ORDER BY month DESC").all(userId);
  },
  async addPayment(userId: number, amount: number, month: string, method: string, transactionId: string) {
    if (useSupabase()) {
      await supabase!.from('payments').insert({ user_id: userId, amount, month, method, transaction_id: transactionId });
    } else {
      db.prepare("INSERT INTO payments (user_id, amount, month, method, transaction_id) VALUES (?, ?, ?, ?, ?)").run(userId, amount, month, method, transactionId);
    }
  },
  async getAllPayments() {
    if (useSupabase()) {
      const { data } = await supabase!.from('payments').select('*, users(name, phone)').order('created_at', { ascending: false });
      return data?.map((p: any) => ({ ...p, user_name: p.users?.name, user_phone: p.users?.phone })) || [];
    }
    return db.prepare("SELECT p.*, u.name as user_name, u.phone as user_phone FROM payments p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC").all();
  },
  async approvePayment(paymentId: number, status: string) {
    if (useSupabase()) {
      await supabase!.from('payments').update({ status }).eq('id', paymentId);
    } else {
      db.prepare("UPDATE payments SET status = ? WHERE id = ?").run(status, paymentId);
    }
  },
  async getMembers() {
    if (useSupabase()) {
      const { data } = await supabase!.from('users').select('id, name, phone, member_id').eq('role', 'member');
      return data || [];
    }
    return db.prepare("SELECT id, name, phone, member_id FROM users WHERE role = 'member'").all();
  },
  async getFullBackup() {
    if (useSupabase()) {
      const { data: users } = await supabase!.from('users').select('*');
      const { data: payments } = await supabase!.from('payments').select('*');
      const { data: transactions } = await supabase!.from('transactions').select('*');
      const { data: settings } = await supabase!.from('settings').select('*');
      const { data: slider_images } = await supabase!.from('slider_images').select('*');
      return { users, payments, transactions, settings, slider_images };
    }
    const users = db.prepare("SELECT * FROM users").all();
    const payments = db.prepare("SELECT * FROM payments").all();
    const transactions = db.prepare("SELECT * FROM transactions").all();
    const settings = db.prepare("SELECT * FROM settings").all();
    const slider_images = db.prepare("SELECT * FROM slider_images").all();
    return { users, payments, transactions, settings, slider_images };
  }
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Settings API
  app.get("/api/db-status", (req, res) => {
    const status = { 
      type: useSupabase() ? "supabase" : "sqlite",
      connected: !!supabase
    };
    console.log(`API: /api/db-status requested. Returning: ${JSON.stringify(status)}`);
    res.json(status);
  });

  app.get("/api/settings", async (req, res) => {
    const settingsObj = await dbService.getSettings();
    res.json(settingsObj);
  });

  app.post("/api/admin/settings", async (req, res) => {
    const { bkash_number, nagad_number, admin_phone, admin_name, admin_profile_pic } = req.body;
    if (bkash_number) await dbService.updateSetting('bkash_number', bkash_number);
    if (nagad_number) await dbService.updateSetting('nagad_number', nagad_number);
    if (admin_phone) {
      await dbService.updateSetting('admin_phone', admin_phone);
      // Note: Admin user update handled by setting update logic if needed
    }
    if (admin_name) await dbService.updateSetting('admin_name', admin_name);
    if (admin_profile_pic !== undefined) await dbService.updateSetting('admin_profile_pic', admin_profile_pic);
    res.json({ success: true });
  });

  // Slider Images API
  app.get("/api/slider-images", async (req, res) => {
    const images = await dbService.getSliderImages();
    res.json(images);
  });

  app.post("/api/admin/slider-images", async (req, res) => {
    const { url } = req.body;
    await dbService.addSliderImage(url);
    res.json({ success: true });
  });

  app.delete("/api/admin/slider-images/:id", async (req, res) => {
    await dbService.deleteSliderImage(req.params.id);
    res.json({ success: true });
  });

  // Auth Routes
  app.post("/api/login", async (req, res) => {
    const { phone, password } = req.body;
    const user = await dbService.getUserByPhoneOrId(phone);
    if (user && bcrypt.compareSync(password, user.password)) {
      if (user.role !== 'admin' && user.status !== 'active') {
        return res.status(403).json({ success: false, message: "আপনার একাউন্টটি এখনো একটিভ করা হয়নি। দয়া করে এডমিনের অনুমোদনের জন্য অপেক্ষা করুন।" });
      }
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "ভুল ফোন নম্বর বা পাসওয়ার্ড" });
    }
  });

  app.post("/api/change-password", async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    const user = await dbService.getUserById(userId);
    if (user && bcrypt.compareSync(oldPassword, user.password)) {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      await dbService.updateUserPassword(userId, hashedPassword);
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "পুরানো পাসওয়ার্ড সঠিক নয়" });
    }
  });

  app.post("/api/reset-password-request", async (req, res) => {
    const { phone } = req.body;
    const user = await dbService.getUserByPhoneOrId(phone);
    if (user) {
      res.json({ success: true, message: "ফোন নম্বরটি সঠিক। এখন নতুন পাসওয়ার্ড দিন।" });
    } else {
      res.status(404).json({ success: false, message: "এই ফোন নম্বরে কোনো একাউন্ট পাওয়া যায়নি" });
    }
  });

  app.post("/api/reset-password-confirm", async (req, res) => {
    const { phone, newPassword } = req.body;
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await dbService.resetUserPassword(phone, hashedPassword);
    res.json({ success: true });
  });

  app.post("/api/register", async (req, res) => {
    const { name, phone, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const count = await dbService.getUsersCount();
      const memberId = `BS-${String(count + 1).padStart(3, '0')}`;
      const userId = await dbService.registerUser(name, phone, hashedPassword, memberId);
      res.json({ success: true, userId });
    } catch (e) {
      res.status(400).json({ success: false, message: "ফোন নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে" });
    }
  });

  app.post("/api/user/update-profile", async (req, res) => {
    const { userId, profilePic } = req.body;
    await dbService.updateUserProfilePic(userId, profilePic);
    res.json({ success: true });
  });

  app.post("/api/user/request-deactivation", async (req, res) => {
    const { userId } = req.body;
    await dbService.requestDeactivation(userId);
    res.json({ success: true });
  });

  app.get("/api/admin/member-management", async (req, res) => {
    const data = await dbService.getMemberManagement();
    res.json(data);
  });

  app.post("/api/admin/add-member", async (req, res) => {
    const { name, phone, password, memberId } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      await dbService.addMember(name, phone, hashedPassword, memberId);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ success: false, message: "ফোন নম্বর বা সদস্য আইডি ইতিমধ্যে ব্যবহৃত হয়েছে" });
    }
  });

  app.post("/api/admin/approve-member", async (req, res) => {
    const { userId } = req.body;
    await dbService.approveMember(userId);
    res.json({ success: true });
  });

  app.post("/api/admin/deactivate-member", async (req, res) => {
    const { userId } = req.body;
    await dbService.deactivateMember(userId);
    res.json({ success: true });
  });

  app.get("/api/fund-balance", async (req, res) => {
    const balance = await dbService.getFundBalance();
    res.json({ balance });
  });

  // Income/Expense Transactions API
  app.get("/api/transactions", async (req, res) => {
    const transactions = await dbService.getTransactions(true);
    res.json(transactions);
  });

  app.get("/api/admin/transactions", async (req, res) => {
    const transactions = await dbService.getTransactions(false);
    res.json(transactions);
  });

  app.post("/api/transactions", async (req, res) => {
    const { type, description, amount, userId } = req.body;
    await dbService.addTransaction(type, description, amount, userId);
    res.json({ success: true });
  });

  app.post("/api/admin/approve-transaction", async (req, res) => {
    const { id, status } = req.body;
    await dbService.approveTransaction(id, status);
    res.json({ success: true });
  });

  // Member Search API
  app.get("/api/admin/member-search/:memberId", async (req, res) => {
    const data = await dbService.getMemberDetails(req.params.memberId);
    if (!data) return res.status(404).json({ message: "সদস্য পাওয়া যায়নি" });
    res.json(data);
  });

  // Member Routes
  app.get("/api/payments/:userId", async (req, res) => {
    const payments = await dbService.getPaymentsByUserId(req.params.userId);
    res.json(payments);
  });

  app.post("/api/payments", async (req, res) => {
    const { userId, amount, month, method, transactionId } = req.body;
    await dbService.addPayment(userId, amount, month, method, transactionId);
    res.json({ success: true });
  });

  app.get("/api/admin/all-payments", async (req, res) => {
    const payments = await dbService.getAllPayments();
    res.json(payments);
  });

  app.post("/api/admin/approve-payment", async (req, res) => {
    const { paymentId, status } = req.body;
    await dbService.approvePayment(paymentId, status);
    res.json({ success: true });
  });

  app.get("/api/admin/members", async (req, res) => {
    const members = await dbService.getMembers();
    res.json(members);
  });

  app.post("/api/admin/sync-to-cloud", async (req, res) => {
    if (!useSupabase()) {
      return res.status(400).json({ success: false, message: "Cloud connection not configured." });
    }
    try {
      const sqliteData = {
        users: db.prepare("SELECT * FROM users").all(),
        payments: db.prepare("SELECT * FROM payments").all(),
        transactions: db.prepare("SELECT * FROM transactions").all(),
        settings: db.prepare("SELECT * FROM settings").all(),
        slider_images: db.prepare("SELECT * FROM slider_images").all()
      };

      // Sync Users (upsert by phone/member_id)
      for (const user of sqliteData.users) {
        const { id, ...userData } = user;
        await supabase!.from('users').upsert(userData, { onConflict: 'phone' });
      }

      // Sync Settings
      for (const setting of sqliteData.settings) {
        await supabase!.from('settings').upsert(setting);
      }

      // Sync Slider Images
      for (const img of sqliteData.slider_images) {
        const { id, ...imgData } = img;
        await supabase!.from('slider_images').upsert(imgData);
      }

      // Sync Payments
      for (const payment of sqliteData.payments) {
        const { id, ...paymentData } = payment;
        await supabase!.from('payments').upsert(paymentData, { onConflict: 'transaction_id' });
      }

      // Sync Transactions
      for (const transaction of sqliteData.transactions) {
        const { id, ...transactionData } = transaction;
        await supabase!.from('transactions').upsert(transactionData);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/admin/backup", async (req, res) => {
    const data = await dbService.getFullBackup();
    res.json({
      backup_date: new Date().toISOString(),
      data
    });
  });

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        allowedHosts: true,
        hmr: false
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
