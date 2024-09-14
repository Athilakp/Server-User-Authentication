const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const SimpleJsonDb = require("simple-json-db");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const db = new SimpleJsonDb("./db.json");
const PORT = 5000;

app.use(express.json());
app.use(cors());

if (!db.get("users")) {
  db.set("users", [
    {
      id: uuidv4(),
      username: "SuperAdmin",
      password: "superAdmin@123",
      role: "superadmin",
    },
  ]);
}

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = db.get("users") || [];

  const user = users.find((u) => u.username === username);
  if (!user) return res.status(400).json({ message: "User not found" });

  if (user.password !== password)
    return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign(
    { username: user.username, role: user.role, id: user.id },
    "secretKey",
    {
      expiresIn: "1h",
    }
  );
  res.json({ token, username: user.username, role: user.role, id: user.id });
});
app.get("/admins", (req, res) => {
  const users = db.get("users") || [];
  const admins = users.filter((u) => u.role === "admin");
  res.json(admins);
});
app.post("/admins", (req, res) => {
  const { adminName, email, password } = req.body;

  const newAdmin = {
    id: uuidv4(),
    username: adminName,
    email,
    password: password,
    role: "admin",
  };

  const users = db.get("users") || [];
  users.push(newAdmin);
  db.set("users", users);

  res.status(201).json(newAdmin);
});

app.get("/superusers", (req, res) => {
  const adminId = req.query.adminId;
  const role = req.query.role;
  const users = db.get("users") || [];
  if (role === "superadmin") {
    return res.json(users.filter((u) => u.role === "superuser"));
  }
  const superUsers = users.filter(
    (u) => u.role === "superuser" && u.createdBy === adminId
  );
  res.json(superUsers);
});

app.post("/superusers", (req, res) => {
  const { superuserName, email, password, adminId } = req.body;

  const newSuperUser = {
    id: uuidv4(),
    username: superuserName,
    email,
    password,
    role: "superuser",
    createdBy: adminId,
  };

  const users = db.get("users") || [];
  users.push(newSuperUser);
  db.set("users", users);

  res.status(201).json(newSuperUser);
});

app.get("/users", (req, res) => {
  const adminId = req.query.adminId;
  const role = req.query.role;
  const users = db.get("users") || [];
  if (role === "superadmin") {
    return res.json(users.filter((u) => u.role === "user"));
  }
  const usersList = users.filter(
    (u) => u.role === "user" && u.createdBy === adminId
  );
  res.json(usersList);
});

app.post("/users", (req, res) => {
  const { userName, email, password, adminId } = req.body;

  const newUser = {
    id: uuidv4(),
    username: userName,
    email,
    password,
    role: "user",
    createdBy: adminId,
  };

  const users = db.get("users") || [];
  users.push(newUser);
  db.set("users", users);

  res.status(201).json(newUser);
});
app.get("/dashboard-stats", (req, res) => {
  const users = db.get("users") || {};
  const adminCount = users.filter((u) => u.role === "admin").length;
  const superuserCount = users.filter((u) => u.role === "superuser").length;
  const userCount = users.filter((u) => u.role === "user").length;

  res.json({
    adminCount,
    superuserCount,
    userCount,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
