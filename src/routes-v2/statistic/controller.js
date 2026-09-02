/** @format */

const StatisticRepository = require("./repository");

const statistic_detail = async (req, res) => {
  try {
    const statistic = await StatisticRepository.findDefault();
    res.status(200).json({ status: 200, message: "success", data: statistic });
  } catch (error) {
    console.log(error);
    res.status(200).json({ status: 200, data: {}, message: "No Statistic Found" });
  }
};

const adjust = async (req, res) => {
  const {
    year_experience,
    total_participant,
    total_topic_class,
    total_training_completed,
  } = req.body;

  try {
    const stat = await StatisticRepository.findDefault();
    if (!stat) {
      return res.status(400).json({
        status: 400,
        message: "statistic not found",
      });
    }
    await StatisticRepository.update(stat.id, {
      year_experience: year_experience !== undefined ? Number(year_experience) : undefined,
      total_participant:
        total_participant !== undefined ? Number(total_participant) : undefined,
      total_topic_class:
        total_topic_class !== undefined ? Number(total_topic_class) : undefined,
      total_training_completed:
        total_training_completed !== undefined
          ? Number(total_training_completed)
          : undefined,
      updated_at: new Date(),
    });

    res.status(200).json({
      status: 200,
      message: `successfully update statistic`,
    });
  } catch (err) {
    return res.status(404).json({
      status: 404,
      message: "failed to update statistic",
    });
  }
};

module.exports = { statistic_detail, adjust };
