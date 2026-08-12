require("dotenv").config();
const bcrypt = require("bcrypt");
const { sequelize, User, Todo } = require("../models");

const SALT_ROUNDS = 10;

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("Koneksi database berhasil");

    // pastiin tabel udah ada
    await sequelize.sync();

    // password plain buat semua dummy user: "password123"
    const hashedPassword = await bcrypt.hash("password123", SALT_ROUNDS);

    // upsert user
    const [user1] = await User.findOrCreate({
      where: { username: "rizki" },
      defaults: { password: hashedPassword },
    });

    const [user2] = await User.findOrCreate({
      where: { username: "budi" },
      defaults: { password: hashedPassword },
    });

    console.log("User dummy siap:", user1.username, "&", user2.username);

    // daftar todo dummy
    const dummyTodos = [
      { title: "Belajar Sequelize", is_done: true, user_id: user1.id },
      { title: "Bikin API Todo", is_done: true, user_id: user1.id },
      { title: "Nambahin fitur seeder", is_done: false, user_id: user1.id },
      { title: "Review PR temen", is_done: false, user_id: user2.id },
      { title: "Fix bug login", is_done: false, user_id: user2.id },
    ];

    for (const t of dummyTodos) {
      await Todo.findOrCreate({
        where: { title: t.title, user_id: t.user_id },
        defaults: t,
      });
    }

    console.log("Todo dummy berhasil dipastikan tersimpan di database");
    console.log("\nSeeding selesai ✅");
    console.log("Login pake salah satu ini:");
    console.log("  username: rizki  | password: password123");
    console.log("  username: budi   | password: password123");

    process.exit(0);
  } catch (err) {
    console.error("Gagal seeding:", err.message);
    process.exit(1);
  }
}

seed();
