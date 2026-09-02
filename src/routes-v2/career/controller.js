/** @format */

// =========================================================================
// Career Controller v2 (PostgreSQL / Prisma)
// =========================================================================
// Includes: career CRUD, applicant (apply_job), and gallery
// =========================================================================

const CareerRepository = require("./repository");

const { upload, destroy } = require("../../lib/cd");

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v !== undefined && v !== "") return [v];
  return [];
};

// =================== Career ===================

const career_list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const department = req.query.department;
    const location = req.query.location;
    const job_type = req.query.job_type;
    const experience_level = req.query.experience_level;
    const status = req.query.status;
    const sort_order = req.query.sort_order || "desc";
    const search = req.query.search;

    const filter = {};

    if (req.path.includes("/public/")) {
      filter.status = "PUBLISHED";
    } else if (status) {
      filter.status = status;
    }

    if (department) {
      filter.department = { contains: department, mode: "insensitive" };
    }
    if (location) {
      filter.location = { contains: location, mode: "insensitive" };
    }
    if (job_type) filter.job_type = job_type;
    if (experience_level) filter.experience_level = experience_level;

    if (search) {
      filter.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderDir = sort_order === "asc" ? "asc" : "desc";
    const sort = [{ created_at: orderDir }, { id: orderDir }];

    const total_careers = await CareerRepository.countCareers(filter);
    const total_pages = Math.ceil(total_careers / limit);

    const careers = await CareerRepository.paginateCareers({
      filter,
      sort,
      skip,
      take: limit,
    });

    res.status(200).json({
      status: 200,
      message: "success",
      data: careers,
      pagination: {
        current_page: page,
        total_pages,
        total_careers,
        per_page: limit,
        has_next: page < total_pages,
        has_prev: page > 1,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const career_detail = async (req, res) => {
  const { id } = req.params;
  try {
    const career = await CareerRepository.updateCareer(id, {
      views: { increment: 1 },
    });
    if (!career) {
      return res.status(404).json({ status: 404, message: "Career not found" });
    }
    res.status(200).json({ status: 200, message: "success", data: career });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const career_by_slug = async (req, res) => {
  const { slug } = req.params;
  try {
    // findUnique doesn't support generic filter; use updateMany with where slug
    const existing = await prisma.career.findUnique({ where: { slug } });
    if (!existing) {
      return res.status(404).json({ status: 404, message: "Career not found" });
    }
    const career = await CareerRepository.updateCareer(existing.id, {
      views: { increment: 1 },
    });
    res.status(200).json({ status: 200, message: "success", data: career });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const prisma = require("../../config/prisma");

const add = async (req, res) => {
  const {
    title,
    description,
    requirements,
    experiance_requirement,
    applicant_question,
    location,
    department,
    job_type,
    experience_level,
    vacancies,
    contact_email,
    deadline,
    status,
  } = req.body;

  try {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload = {
      title,
      slug,
      description: toArray(description).filter((d) => d && d.trim()),
      requirements: toArray(requirements).filter((r) => r && r.trim()),
      experiance_requirement: toArray(experiance_requirement).filter(
        (e) => e && e.trim()
      ),
      applicant_question: toArray(applicant_question).filter((q) => q && q.trim()),
      location,
      department,
      job_type,
      experience_level,
      vacancies: vacancies || 1,
      contact_email,
      deadline: deadline ? new Date(deadline) : null,
      status: status || "PUBLISHED",
    };

    const career = await CareerRepository.createCareer(payload);

    res.status(201).json({
      status: 201,
      message: "success",
      data: career,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

const adjust = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    requirements,
    experiance_requirement,
    applicant_question,
    location,
    department,
    job_type,
    experience_level,
    vacancies,
    contact_email,
    deadline,
    status,
  } = req.body;

  try {
    const payload = {
      description: toArray(description),
      requirements: toArray(requirements).filter((r) => r && r.trim()),
      experiance_requirement: toArray(experiance_requirement).filter(
        (e) => e && e.trim()
      ),
      applicant_question: toArray(applicant_question).filter((q) => q && q.trim()),
      location,
      department,
      job_type,
      experience_level,
      vacancies: vacancies !== undefined ? Number(vacancies) : undefined,
      contact_email,
      deadline: deadline ? new Date(deadline) : undefined,
      status,
      updated_at: new Date(),
    };

    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      payload.title = title;
      payload.slug = slug;
    }

    const career = await CareerRepository.updateCareer(id, payload);

    res.status(200).json({
      status: 200,
      message: `successfully update career ${id}`,
      data: career,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(404).json({ status: 404, message: "Career not found" });
  }
};

const takedown = async (req, res) => {
  const { id } = req.params;
  try {
    await CareerRepository.removeCareer(id);
    res.status(200).json({
      status: 200,
      message: `successfully takedown career ${id}`,
    });
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ status: 404, message: "Career not found" });
  }
};

// =================== Applicants ===================

const apply_job = async (req, res) => {
  const {
    career_id,
    full_name,
    email,
    phone,
    cover_letter,
    portfolio_url,
    linkedin_url,
    github_url,
    experience_years,
    current_position,
    current_company,
    availability_date,
  } = req.body;

  try {
    const career = await CareerRepository.findCareerById(career_id);
    if (!career) {
      return res.status(404).json({ status: 404, message: "Career not found" });
    }

    if (career.status !== "PUBLISHED") {
      return res.status(400).json({
        status: 400,
        message: "This job posting is not accepting applications",
      });
    }

    if (career.deadline && new Date() > career.deadline) {
      return res.status(400).json({
        status: 400,
        message: "Application deadline has passed",
      });
    }

    const existingApplication = await CareerRepository.findApplicantByCareerAndEmail(
      career_id,
      email
    );
    if (existingApplication) {
      return res.status(400).json({
        status: 400,
        message: "You have already applied for this position",
      });
    }

    const payload = {
      career_id,
      full_name,
      email,
      phone,
      cover_letter,
      portfolio_url,
      linkedin_url,
      github_url,
      experience_years: experience_years ? Number(experience_years) : 0,
      current_position,
      current_company,
      availability_date: availability_date ? new Date(availability_date) : null,
    };

    if (req.files && req.files.file) {
      const { url_picture, url_public } = await upload(req.files.file);
      payload.resume = { public_id: url_public, url: url_picture };
    }

    const applicant = await CareerRepository.createApplicant(payload);

    // Atomic increment (setara $inc: { applicants_count: 1 })
    await CareerRepository.incrementApplicantsCount(career_id, 1);

    res.status(201).json({
      status: 201,
      message: "Application submitted successfully",
      data: applicant,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

const applicants_list = async (req, res) => {
  try {
    const { career_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const sort_order = req.query.sort_order || "desc";
    const search = req.query.search;

    const filter = { career_id };
    if (status) filter.status = status;

    if (search) {
      filter.OR = [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { current_position: { contains: search, mode: "insensitive" } },
      ];
    }

    const sort = { applied_at: sort_order === "asc" ? "asc" : "desc" };

    const total_applicants = await CareerRepository.countApplicants(filter);
    const total_pages = Math.ceil(total_applicants / limit);

    const applicants = await CareerRepository.paginateApplicants({
      filter,
      sort,
      skip,
      take: limit,
    });

    res.status(200).json({
      status: 200,
      message: "success",
      data: applicants,
      pagination: {
        current_page: page,
        total_pages,
        total_applicants,
        per_page: limit,
        has_next: page < total_pages,
        has_prev: page > 1,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const applicant_detail = async (req, res) => {
  const { id } = req.params;
  try {
    const applicant = await CareerRepository.findApplicantById(id);
    if (!applicant) {
      return res.status(404).json({ status: 404, message: "Applicant not found" });
    }
    res.status(200).json({ status: 200, message: "success", data: applicant });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const update_applicant_status = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  try {
    const applicant = await CareerRepository.updateApplicant(id, {
      status,
      notes,
      updated_at: new Date(),
    });
    res.status(200).json({
      status: 200,
      message: "Applicant status updated successfully",
      data: applicant,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const delete_applicant = async (req, res) => {
  const { id } = req.params;
  try {
    const applicant = await CareerRepository.findApplicantById(id);
    if (!applicant) {
      return res.status(404).json({ status: 404, message: "Applicant not found" });
    }

    await CareerRepository.removeApplicant(id);

    if (applicant.resume && applicant.resume.public_id) {
      await destroy(applicant.resume.public_id);
    }

    // Atomic decrement (setara $inc: { applicants_count: -1 })
    await CareerRepository.incrementApplicantsCount(applicant.career_id, -1);

    res.status(200).json({
      status: 200,
      message: "Applicant deleted successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

// =================== Gallery ===================

const gallery_list = async (req, res) => {
  try {
    const galleries = await CareerRepository.findActiveGalleries();
    res.status(200).json({ status: 200, message: "success", data: galleries });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const gallery_list_admin = async (req, res) => {
  try {
    const galleries = await CareerRepository.findAllGalleries();
    res.status(200).json({ status: 200, message: "success", data: galleries });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const gallery_detail = async (req, res) => {
  const { id } = req.params;
  try {
    const gallery = await CareerRepository.findGalleryById(id);
    if (!gallery) {
      return res
        .status(404)
        .json({ status: 404, message: "Gallery not found", data: null });
    }
    res.status(200).json({ status: 200, message: "success", data: gallery });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const gallery_add = async (req, res) => {
  const { title, description, order } = req.body;
  try {
    const payload = {
      title,
      description: description || "",
      order: order ? parseInt(order) : 0,
    };

    if (req.files && req.files.file) {
      const { url_picture, url_public } = await upload(req.files.file);
      payload.image = { public_id: url_public, url: url_picture };
    }

    const gallery = await CareerRepository.createGallery(payload);
    res.status(201).json({ status: 201, message: "success", data: gallery });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

const gallery_adjust = async (req, res) => {
  const { id } = req.params;
  const { title, description, order, is_active } = req.body;
  try {
    const payload = { updated_at: new Date() };
    if (title !== undefined) payload.title = title;
    if (description !== undefined) payload.description = description;
    if (order !== undefined) payload.order = parseInt(order);
    if (is_active !== undefined)
      payload.is_active = is_active === "true" || is_active === true;

    if (req.files && req.files.file) {
      const { url_picture, url_public } = await upload(req.files.file);
      payload.image = { public_id: url_public, url: url_picture };
    } else if (req.body.image && req.body.image !== "undefined") {
      payload.image = JSON.parse(req.body.image);
    }

    const gallery = await CareerRepository.updateGallery(id, payload);
    res.status(200).json({ status: 200, message: "success", data: gallery });
  } catch (error) {
    console.log(error.message);
    return res
      .status(404)
      .json({ status: 404, message: "Gallery not found" });
  }
};

const gallery_takedown = async (req, res) => {
  const { id } = req.params;
  try {
    const gallery = await CareerRepository.findGalleryById(id);
    if (!gallery) {
      return res
        .status(404)
        .json({ status: 404, message: "Gallery not found" });
    }
    if (gallery.image && gallery.image.public_id) {
      await destroy(gallery.image.public_id);
    }
    await CareerRepository.removeGallery(id);
    res.status(200).json({ status: 200, message: "success" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

module.exports = {
  // Career
  add,
  career_list,
  career_detail,
  career_by_slug,
  adjust,
  takedown,
  // Applicants
  apply_job,
  applicants_list,
  applicant_detail,
  update_applicant_status,
  delete_applicant,
  // Gallery
  gallery_list,
  gallery_list_admin,
  gallery_detail,
  gallery_add,
  gallery_adjust,
  gallery_takedown,
};
