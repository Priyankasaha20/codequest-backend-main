export async function listInterviewTypes(req, res, next) {
  try {
    const types = await InterviewType.find({});
    res.json(types);
  } catch (err) {
    next(err);
  }
}
