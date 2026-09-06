/** @format */

const PageContentRepository = require("./repository");

// =========================================================================
// Page Content Controller v2
// =========================================================================
// Halaman statis untuk compro (About, dll). Setiap halaman = satu record
// `PageContent` dengan `code` unik; `content` menyimpan JSON utuh.
// =========================================================================

/** Public: konten halaman menurut code (hanya yg aktif). */
const page_detail = async (req, res) => {
  const { code } = req.params;
  try {
    const page = await PageContentRepository.findActiveByCode(code);
    if (!page) {
      return res.status(404).json({
        status: 404,
        message: `Page "${code}" not found`,
      });
    }
    res.status(200).json({ status: 200, message: "success", data: page });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

/** Admin: detail halaman (termasuk non-aktif). */
const admin_detail = async (req, res) => {
  const { code } = req.params;
  try {
    const page = await PageContentRepository.findByCode(code);
    if (!page) {
      return res.status(404).json({
        status: 404,
        message: `Page "${code}" not found`,
      });
    }
    res.status(200).json({ status: 200, message: "success", data: page });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

/** Admin: daftar semua halaman (untuk daftar menu Pages). */
const page_list = async (req, res) => {
  try {
    const pages = await PageContentRepository.findAll();
    res.status(200).json({ status: 200, message: "success", data: pages });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

/** Admin: simpan konten halaman (create bila belum ada, update bila ada). */
const adjust = async (req, res) => {
  const { code } = req.params;
  const { title, content, is_active } = req.body;

  try {
    if (!code) {
      return res.status(400).json({ status: 400, message: "code is required" });
    }
    if (content === undefined && title === undefined && is_active === undefined) {
      return res.status(400).json({
        status: 400,
        message: "title, content or is_active is required",
      });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (is_active !== undefined) data.is_active = !!is_active;

    const page = await PageContentRepository.upsertByCode(code, {
      ...data,
      updated_at: new Date(),
    });

    res.status(200).json({
      status: 200,
      message: `page "${code}" updated`,
      data: page,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

module.exports = { page_detail, admin_detail, page_list, adjust };