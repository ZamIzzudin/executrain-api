/** @format */

// =========================================================================
// Article Controller v2 (PostgreSQL / Prisma)
// =========================================================================

const ArticleRepository = require("./repository");
const { destroy } = require("../../lib/cd");
const { hasAzureCredentials } = require("../../config/azure-blob");

/**
 * Ekstrak URL gambar dari HTML konten (src dari <img>).
 * @param {string} html
 * @returns {string[]}
 */
function extractImageUrls(html) {
  if (!html) return [];
  const urls = [];
  const srcRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = srcRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

/**
 * Hapus URL gambar dari storage jika tidak dipakai artikel lain.
 * @param {string[]} urls
 * @param {string} excludeId - id artikel yang sedang diubah (jangan dihitung)
 */
async function deleteUnusedImages(urls, excludeId) {
  if (!hasAzureCredentials || urls.length === 0) return;
  for (const url of urls) {
    try {
      const used = await ArticleRepository.countContentContains(url, excludeId);
      if (used === 0) {
        await destroyFromUrl(url);
      }
    } catch (e) {
      console.error(`Cleanup image failed (${url}):`, e.message);
    }
  }
}

/** Hapus blob dari URL publik (atau public_id) via destroy() */
async function destroyFromUrl(url) {
  const { AZURE_PUBLIC_BASE_URL, AZURE_IMAGE_CONTAINER } = require("../../config/azure-blob");
  try {
    const parsed = new URL(url);
    // path: /image/article/xxx.jpg → blobName: article/xxx.jpg
    let blobName = parsed.pathname.replace(/^\//, "").split("/").slice(1).join("/");
    if (!blobName) {
      console.warn(`Cannot extract blobName from ${url}`);
      return;
    }
    await destroy(blobName);
    console.log(`Image cleaned up: ${url}`);
  } catch (e) {
    console.warn(`Skipping cleanup for ${url}:`, e.message);
  }
}

const list = async (req, res) => {
  try {
    const { search } = req.query;
    const data = search
      ? await ArticleRepository.search(search)
      : await ArticleRepository.findAll();

    return res.status(200).json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(200).json({
      status: 200,
      data: [],
      message: "No Article Found",
    });
  }
};

const detail = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await ArticleRepository.findById(id);
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Article not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

const create = async (req, res) => {
  const { title, category, content } = req.body;

  try {
    const data = await ArticleRepository.create({
      title,
      category: Array.isArray(category) ? category : [],
      content: content || "",
    });

    return res.status(201).json({
      status: 201,
      message: "success",
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "failed to create article",
      info: error.message,
    });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { title, category, content } = req.body;

  try {
    const existing = await ArticleRepository.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 404,
        message: "Article not found",
      });
    }

    const newContent = content ?? existing.content;

    const data = await ArticleRepository.update(id, {
      title: title ?? existing.title,
      category:
        category !== undefined
          ? Array.isArray(category)
            ? category
            : []
          : existing.category,
      content: newContent,
      updated_at: new Date(),
    });

    // Bersihkan gambar yang tidak dipakai lagi (dihapus/diganti) dari storage
    const oldUrls = extractImageUrls(existing.content);
    const newUrls = extractImageUrls(newContent);
    const removedUrls = oldUrls.filter((u) => !newUrls.includes(u));
    await deleteUnusedImages(removedUrls, id);

    return res.status(200).json({
      status: 200,
      message: `successfully update article ${id}`,
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "failed to update article",
      info: error.message,
    });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await ArticleRepository.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 404,
        message: "Article not found",
      });
    }

    await ArticleRepository.remove(id);

    // Bersihkan semua gambar di konten artikel dari storage
    const urls = extractImageUrls(existing.content);
    await deleteUnusedImages(urls, id);

    return res.status(200).json({
      status: 200,
      message: `successfully takedown article ${id}`,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "article not found",
    });
  }
};

module.exports = {
  list,
  detail,
  create,
  update,
  remove,
};
