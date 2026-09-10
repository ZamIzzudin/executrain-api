/** @format */

// =========================================================================
// Schedule Repository v2 (PostgreSQL / Prisma)
// =========================================================================
// Jadwal kelas (Course / Skill Accelerator).
// Satu baris = satu program pada satu tanggal. `entity_type` + `entity_id`
// bersifat polymorphic ke Course atau SkillAccelerator (tanpa FK).
// =========================================================================

const prisma = require("../../config/prisma");

const listSelect = {
  id: true,
  entity_type: true,
  entity_id: true,
  program_name: true,
  schedule_date: true,
  is_active: true,
  created_at: true,
  updated_at: true,
};

const ScheduleRepository = {
  findMany({ filter, sort, skip, take }) {
    return prisma.schedule.findMany({
      where: filter,
      select: listSelect,
      orderBy: sort,
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    });
  },

  findById(id) {
    return prisma.schedule.findUnique({ where: { id } });
  },

  findByIdFull(id) {
    return prisma.schedule.findUnique({ where: { id } });
  },

  create(data) {
    return prisma.schedule.create({ data });
  },

  createMany(data, skipDuplicates = true) {
    return prisma.schedule.createMany({ data, skipDuplicates });
  },

  update(id, data) {
    return prisma.schedule.update({ where: { id }, data });
  },

  remove(id) {
    return prisma.schedule.delete({ where: { id } });
  },

  removeMany(ids) {
    return prisma.schedule.deleteMany({ where: { id: { in: ids } } });
  },

  /** Hitung berapa schedule utk 1 entity (validasi sebelum hapus course/SA). */
  countByEntity(entity_type, entity_id) {
    return prisma.schedule.count({ where: { entity_type, entity_id } });
  },
};

module.exports = ScheduleRepository;
