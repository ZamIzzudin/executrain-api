/** @format */

// =========================================================================
// Career Repository v2 (PostgreSQL / Prisma)
// =========================================================================
// Mencakup: Career, CareerApplicant, CareerGallery
// =========================================================================

const prisma = require("../../config/prisma");

const careerListSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  requirements: true,
  experiance_requirement: true,
  applicant_question: true,
  location: true,
  department: true,
  job_type: true,
  experience_level: true,
  vacancies: true,
  contact_email: true,
  deadline: true,
  status: true,
  created_at: true,
};

const careerGallerySelect = {
  id: true,
  title: true,
  description: true,
  image: true,
  order: true,
  is_active: true,
};

const CareerRepository = {
  // ===== Career =====
  countCareers(filter) {
    return prisma.career.count({ where: filter });
  },

  paginateCareers({ filter, sort, skip, take }) {
    return prisma.career.findMany({
      where: filter,
      select: careerListSelect,
      orderBy: sort,
      skip,
      take,
    });
  },

  findCareerById(id) {
    return prisma.career.findUnique({ where: { id } });
  },

  createCareer(data) {
    return prisma.career.create({ data });
  },

  updateCareer(id, data) {
    return prisma.career.update({ where: { id }, data });
  },

  removeCareer(id) {
    return prisma.career.delete({ where: { id } });
  },

  incrementApplicantsCount(id, delta) {
    return prisma.career.update({
      where: { id },
      data: { applicants_count: { increment: delta } },
    });
  },

  // ===== CareerApplicant =====
  findApplicantByCareerAndEmail(career_id, email) {
    return prisma.careerApplicant.findFirst({
      where: { career_id, email },
    });
  },

  countApplicants(filter) {
    return prisma.careerApplicant.count({ where: filter });
  },

  paginateApplicants({ filter, sort, skip, take }) {
    return prisma.careerApplicant.findMany({
      where: filter,
      orderBy: sort,
      skip,
      take,
      include: {
        career: { select: { title: true, department: true, location: true } },
      },
    });
  },

  findApplicantById(id) {
    return prisma.careerApplicant.findUnique({
      where: { id },
      include: {
        career: { select: { title: true, department: true, location: true } },
      },
    });
  },

  createApplicant(data) {
    return prisma.careerApplicant.create({ data });
  },

  updateApplicant(id, data) {
    return prisma.careerApplicant.update({ where: { id }, data });
  },

  removeApplicant(id) {
    return prisma.careerApplicant.delete({ where: { id } });
  },

  // ===== CareerGallery =====
  findActiveGalleries() {
    return prisma.careerGallery.findMany({
      where: { is_active: true },
      select: careerGallerySelect,
      orderBy: [{ order: "asc" }, { created_at: "desc" }],
    });
  },

  findAllGalleries() {
    return prisma.careerGallery.findMany({
      select: careerGallerySelect,
      orderBy: [{ order: "asc" }, { created_at: "desc" }],
    });
  },

  findGalleryById(id) {
    return prisma.careerGallery.findUnique({ where: { id } });
  },

  createGallery(data) {
    return prisma.careerGallery.create({ data });
  },

  updateGallery(id, data) {
    return prisma.careerGallery.update({ where: { id }, data });
  },

  removeGallery(id) {
    return prisma.careerGallery.delete({ where: { id } });
  },
};

module.exports = CareerRepository;
