import SubmissionService from "../services/submissionService.js";
import "../config/dbMongo.js"; // Initialize MongoDB connection

/**
 * Cleanup utility for removing old submissions
 * Can be run as a cron job or scheduled task
 */
async function cleanupSubmissions() {
  try {
    console.log("Starting submission cleanup...");

    // Clean submissions older than 30 days
    const deletedCount = await SubmissionService.cleanupOldSubmissions();

    console.log(
      `✅ Cleanup completed. Deleted ${deletedCount} old submissions.`
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

// Run cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupSubmissions();
}

export default cleanupSubmissions;
