/** @format */

const prisma = require("../../config/prisma");

const testimonialSelect = {
  id: true,
  person_name: true,
  person_title: true,
  testimonial: true,
  photo: true,
};

const TestimonialRepository = {
  findAll() {
    return prisma.testimonial.findMany({ select: testimonialSelect });
  },
  findById(id) {
    return prisma.testimonial.findUnique({ where: { id } });
  },
  create(data) {
    return prisma.testimonial.create({ data });
  },
  update(id, data) {
    return prisma.testimonial.update({ where: { id }, data });
  },
  remove(id) {
    return prisma.testimonial.delete({ where: { id } });
  },
};

module.exports = TestimonialRepository;
