const { Todo } = require("../models");
const sendResponse = require("../utils/response");
const { Op } = require("sequelize");

// GET /todos -> ambil semua todo milik user yg login
async function getTodos(req, res) {
  try {
    const { status, search } = req.query;

    const whereClause = {
      user_id: req.session.userId,
    };

    if (status === "completed") {
      whereClause.is_done = true;
    } else if (status === "active") {
      whereClause.is_done = false;
    }

    if (search && search.trim() !== "") {
      const dialect = sequelize.getDialect();
      const likeOp = dialect === "postgres" ? Op.iLike : Op.like;
      whereClause.title = {
        [likeOp]: `%${search.trim()}%`,
      };
    }

    const todos = await Todo.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    return sendResponse(res, { message: "Berhasil ambil todo", data: todos });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// POST /todos -> tambah todo baru
async function addTodo(req, res) {
  try {
    const { title } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return sendResponse(res, {
        code: 400,
        success: false,
        message: "title wajib diisi dan tidak boleh kosong",
      });
    }

    const todo = await Todo.create({
      title: title.trim(),
      user_id: req.session.userId,
    });

    return sendResponse(res, {
      code: 201,
      message: "Todo berhasil ditambahkan",
      data: todo,
    });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// PUT /todos/:id -> update todo (title / is_done)
async function updateTodo(req, res) {
  try {
    const { id } = req.params;
    const { title, is_done } = req.body;

    const todo = await Todo.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!todo) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Todo tidak ditemukan",
      });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return sendResponse(res, {
          code: 400,
          success: false,
          message: "title tidak boleh kosong",
        });
      }
      todo.title = title.trim();
    }

    if (is_done !== undefined) {
      todo.is_done = Boolean(is_done);
    }

    await todo.save();

    return sendResponse(res, { message: "Todo berhasil diupdate", data: todo });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// DELETE /todos/:id
async function deleteTodo(req, res) {
  try {
    const { id } = req.params;

    const todo = await Todo.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!todo) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Todo tidak ditemukan",
      });
    }

    await todo.destroy();

    return sendResponse(res, { message: "Todo berhasil dihapus" });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

module.exports = { getTodos, addTodo, updateTodo, deleteTodo };
