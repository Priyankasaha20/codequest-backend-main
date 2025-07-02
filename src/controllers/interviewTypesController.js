import InterviewType from "../models/InterviewType.js";

export async function listInterviewTypes(req, res, next) {
  try {
    const types = await InterviewType.find({});
    res.json(types);
  } catch (err) {
    next(err);
  }
}

export async function getInterviewTypeBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const type = await InterviewType.findOne({ slug });

    if (!type) {
      return res.status(404).json({ message: "Interview type not found" });
    }

    res.json(type);
  } catch (err) {
    next(err);
  }
}

export async function createInterviewType(req, res, next) {
  try {
    const { name, slug, description, questions } = req.body;

    // Check if type with this slug already exists
    const existingType = await InterviewType.findOne({ slug });
    if (existingType) {
      return res
        .status(409)
        .json({ message: "Interview type with this slug already exists" });
    }

    const interviewType = new InterviewType({
      name,
      title: name, // For backward compatibility
      slug,
      description,
      questions,
    });

    await interviewType.save();
    res.status(201).json(interviewType);
  } catch (err) {
    next(err);
  }
}

export async function updateInterviewType(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, questions } = req.body;

    const interviewType = await InterviewType.findByIdAndUpdate(
      id,
      {
        name,
        title: name, // For backward compatibility
        description,
        questions,
        ...req.body,
      },
      { new: true }
    );

    if (!interviewType) {
      return res.status(404).json({ message: "Interview type not found" });
    }

    res.json(interviewType);
  } catch (err) {
    next(err);
  }
}

export async function deleteInterviewType(req, res, next) {
  try {
    const { id } = req.params;

    const interviewType = await InterviewType.findByIdAndDelete(id);

    if (!interviewType) {
      return res.status(404).json({ message: "Interview type not found" });
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
