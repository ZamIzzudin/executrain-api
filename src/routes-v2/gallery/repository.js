/** @format */

const prisma = require("../../config/prisma");

const gallerySelect = {
  id: true,
  title: true,
  image: true,
  order: true,
  is_active: true,
};

const GalleryRepository = {
  findActive() {
    return prisma.gallery.findMany({
      where: { is_active: true },
      select: gallerySelect,
      orderBy: [{ order: "asc" }, { created_at: "desc" }],
    });
  },
  findAll() {
    return prisma.gallery.findMany({
      select: gallerySelect,
      orderBy: [{ order: "asc" }, { created_at: "desc" }],
    });
  },
  findById(id) {
    return prisma.gallery.findUnique({ where: { id } });
  },
  create(data) {
    return prisma.gallery.create({ data });
  },
  update(id, data) {
    return prisma.gallery.update({ where: { id }, data });
  },
  remove(id) {
    return prisma.gallery.delete({ where: { id } });
  },
};

module.exports = GalleryRepository;
