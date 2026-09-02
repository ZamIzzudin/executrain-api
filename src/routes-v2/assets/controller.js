/** @format */

const AssetRepository = require("./repository");
const { upload, destroy } = require("../../lib/cd");

const S3_BASE = "https://storagewebsitetoj.blob.core.windows.net/image";

// Default asset list (sama dengan v1)
const ASSET_CATEGORIES = [
  {
    category: "hero_background",
    name: "Hero Background",
    default_url:
      `${S3_BASE}/assets/ddxseg9njypotvqwkgdb.jpg`,
    type: "image",
  },
  {
    category: "hero_video",
    name: "Hero Video",
    default_url: `${S3_BASE}/assets/zc9eubwjugf9txmswlf1.jpg`,
    type: "video",
  },
  {
    category: "steps_background",
    name: "Steps Background",
    default_url: `${S3_BASE}/assets/zc9eubwjugf9txmswlf1.jpg`,
    type: "image",
  },
  {
    category: "services_image",
    name: "Services Section Image",
    default_url: `${S3_BASE}/assets/mh7juzlomjra8xwvtvj5.jpg`,
    type: "image",
  },
  {
    category: "cta_schedule_image",
    name: "CTA Schedule Image",
    default_url: `${S3_BASE}/assets/qhq8pmgzq7tffe5dxaf0.png`,
    type: "image",
  },
  {
    category: "contact_image",
    name: "Contact Section Image",
    default_url: `${S3_BASE}/assets/vqnqkagin0k5ws0rxrvl.jpg`,
    type: "image",
  },
];

async function ensureDefaultAssets() {
  const count = await prisma.asset.count();
  if (count > 0) return;

  const defaults = ASSET_CATEGORIES.map((cat) => ({
    category: cat.category,
    name: cat.name,
    url: cat.default_url,
    fallback_url: cat.default_url,
    type: cat.type,
    is_active: true,
  }));
  await AssetRepository.createMany(defaults);
}

const prisma = require("../../config/prisma");

const asset_list = async (req, res) => {
  try {
    await ensureDefaultAssets();
    const assets = await AssetRepository.findAll();
    res.status(200).json({ status: 200, message: "success", data: assets });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const asset_detail = async (req, res) => {
  const { category } = req.params;
  try {
    await ensureDefaultAssets();
    let asset = await AssetRepository.findByCategory(category);
    if (!asset) {
      return res.status(404).json({
        status: 404,
        message: "Asset category not found",
      });
    }
    res.status(200).json({ status: 200, message: "success", data: asset });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const asset_all = async (req, res) => {
  try {
    await ensureDefaultAssets();
    const assets = await AssetRepository.findAllActive();
    const assetMap = {};
    assets.forEach((a) => {
      assetMap[a.category] = {
        url: a.url,
        fallback_url: a.fallback_url || a.url,
        type: a.type,
      };
    });
    res.status(200).json({ status: 200, message: "success", data: assetMap });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const adjust = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    const asset = await AssetRepository.findById(id);
    if (!asset) {
      return res.status(404).json({ status: 404, message: "Asset not found" });
    }

    const payload = { updated_at: new Date() };

    if (req.files && req.files.file) {
      if (asset.public_id) {
        try {
          await destroy(asset.public_id);
        } catch (e) {
          console.log("Failed to delete old asset:", e.message);
        }
      }
      const { url_picture, url_public } = await upload(req.files.file);
      payload.url = url_picture;
      payload.public_id = url_public;
      if (!asset.fallback_url || asset.fallback_url === asset.url) {
        payload.fallback_url = asset.url;
      }
    }

    if (req.files && req.files.fallback_file) {
      if (asset.fallback_public_id) {
        try {
          await destroy(asset.fallback_public_id);
        } catch (e) {
          console.log("Failed to delete old fallback:", e.message);
        }
      }
      const { url_picture, url_public } = await upload(req.files.fallback_file);
      payload.fallback_url = url_picture;
      payload.fallback_public_id = url_public;
    }

    if (is_active !== undefined)
      payload.is_active = is_active === "true" || is_active === true;

    await AssetRepository.update(id, payload);
    const updated = await AssetRepository.findById(id);

    res.status(200).json({
      status: 200,
      message: "Successfully updated asset",
      data: updated,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "Failed to update asset" });
  }
};

const adjust_url = async (req, res) => {
  const { id } = req.params;
  const { url, fallback_url } = req.body;
  try {
    const asset = await AssetRepository.findById(id);
    if (!asset) {
      return res.status(404).json({ status: 404, message: "Asset not found" });
    }

    const payload = { updated_at: new Date() };
    if (url) payload.url = url;
    if (fallback_url) payload.fallback_url = fallback_url;

    await AssetRepository.update(id, payload);
    const updated = await AssetRepository.findById(id);

    res.status(200).json({
      status: 200,
      message: "Successfully updated asset",
      data: updated,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "Failed to update asset" });
  }
};

module.exports = {
  asset_list,
  asset_detail,
  asset_all,
  adjust,
  adjust_url,
};
