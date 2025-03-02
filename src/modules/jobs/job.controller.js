import { asyncHandler } from "../../utils/index.js";
import jobModel from "../../DB/models/job.schema.js";
import companyModel from "../../DB/models/company.schema.js";
import {
  getIO,
  ApiFeatures,
  UserRole,
  ApplicationStatus,
  eventEmitter,
} from "../../utils/index.js";

// --------- Create Job ---------
export const createJob = asyncHandler(async (req, res, next) => {
  if (!req.user.companyId) {
    return next(
      new Error("User is not associated with any company", { cause: 403 })
    );
  }

  if (
    req.user.role !== UserRole.COMPANYHR &&
    req.user.role !== UserRole.COMPANYOWNER
  ) {
    return next(new Error("Not authorized to create jobs", { cause: 403 }));
  }

  const jobData = {
    ...req.body,
    companyId: req.user.companyId,
    addedBy: req.user._id,
  };

  const job = await jobModel.create(jobData);
  res.status(201).json({ message: "Job created successfully", job });
});

// --------- Update Job ---------
export const updateJob = asyncHandler(async (req, res, next) => {
  const job = await jobModel.findById(req.params.id);
  if (!job) return next(new Error("Job not found", { cause: 404 }));

  if (
    req.user.role !== UserRole.COMPANYOWNER ||
    job.companyId.toString() !== req.user.companyId.toString()
  ) {
    return next(
      new Error("Only company owner can update jobs", { cause: 403 })
    );
  }

  const updatedJob = await jobModel.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true }
  );

  res
    .status(200)
    .json({ message: "Job updated successfully", job: updatedJob });
});

// --------- Get Job By Id ---------
export const getCompanyJobs = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  const company = await companyModel
    .findOne({
      _id: companyId,
      bannedAt: null,
      deletedAt: null,
    })
    .lean();

  if (!company) {
    return next(
      new Error("Company not found or is not active", { cause: 404 })
    );
  }

  const baseQuery = { companyId };
  if (req.query.search) {
    baseQuery.jobTitle = { $regex: req.query.search, $options: "i" };
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const jobs = await jobModel
    .find(baseQuery)
    .populate("companyId", "companyName industry address logo")
    .skip(skip)
    .limit(limit)
    .sort(req.query.sort ? req.query.sort.split(",").join(" ") : "-createdAt")
    .lean();

  const total = await jobModel.countDocuments(baseQuery);

  return res.json({
    success: true,
    results: jobs.length,
    total,
    page,
    data: { company, jobs },
  });
});

// --------- Get All Jobs Via Filtering ---------
export const getFilteredJobs = asyncHandler(async (req, res, next) => {
  const baseQuery = {};
  const filters = ["workingTime", "jobLocation", "seniorityLevel"];

  filters.forEach((filter) => {
    if (req.query[filter]) baseQuery[filter] = req.query[filter];
  });

  if (req.query.jobTitle) {
    baseQuery.jobTitle = { $regex: req.query.jobTitle, $options: "i" };
  }

  if (req.query.technicalSkills) {
    const skills = req.query.technicalSkills
      .split(",")
      .map((skill) => skill.trim());
    baseQuery.technicalSkills = { $in: skills };
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const jobs = await jobModel
    .find(baseQuery)
    .populate({
      path: "companyId",
      select: "companyName industry logo",
      match: { bannedAt: null, deletedAt: null },
    })
    .skip(skip)
    .limit(limit)
    .sort(req.query.sort ? req.query.sort.split(",").join(" ") : "-createdAt")
    .lean();

  const validJobs = jobs.filter((job) => job.companyId != null);
  const total = await jobModel.countDocuments(baseQuery);

  return res.status(200).json({
    success: true,
    results: validJobs.length,
    total,
    page,
    data: validJobs,
  });
});

// --------- Get Job Applications ---------
export const getJobApplications = asyncHandler(async (req, res, next) => {
  const job = await jobModel.findById(req.params.id).populate({
    path: "applications.userId",
    select: "firstName lastName email profilePic",
  });

  if (!job) return next(new Error("Job not found", { cause: 404 }));

  if (
    (req.user.role !== UserRole.COMPANYOWNER &&
      req.user.role !== UserRole.COMPANYHR) ||
    job.companyId.toString() !== req.user.companyId.toString()
  ) {
    return next(
      new Error("Not authorized to view applications", { cause: 403 })
    );
  }

  const features = new ApiFeatures(
    jobModel.findById(req.params.id).populate({
      path: "applications.userId",
      select: "firstName lastName email profilePic",
    }),
    req.query
  )
    .paginate()
    .sort();

  const jobWithApplications = await features.query;

  res.status(200).json({
    results: jobWithApplications.applications.length,
    total: jobWithApplications.applications.length,
    page: parseInt(req.query.page) || 1,
    applications: jobWithApplications.applications,
  });
});

// --------- Apply To Job ---------
export const applyToJob = asyncHandler(async (req, res, next) => {
  if (req.user.role !== UserRole.USER) {
    return next(new Error("Only users can apply to jobs", { cause: 403 }));
  }

  const job = await jobModel.findById(req.params.id).lean();
  if (!job) {
    return next(new Error("Job not found", { cause: 404 }));
  }

  if (job.closed) {
    return next(
      new Error("This job is no longer accepting applications", { cause: 400 })
    );
  }

  const existingApplication = await jobModel.findOne({
    _id: req.params.id,
    "applications.userId": req.user._id,
  });

  if (existingApplication) {
    return next(
      new Error("You have already applied to this job", { cause: 400 })
    );
  }

  const updatedJob = await jobModel.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        applications: {
          userId: req.user._id,
          userCV: req.body.userCV,
          status: ApplicationStatus.PENDING,
        },
      },
    },
    { new: true }
  );

  const io = getIO();
  if (io) {
    io.to(`company_${job.companyId}`).emit("newApplication", {
      jobId: job._id,
      applicantId: req.user._id,
    });
  }

  return res.status(200).json({
    message: "Application submitted successfully",
    application: updatedJob.applications[updatedJob.applications.length - 1],
  });
});

// --------- Update Application Status ---------
export const updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const { jobId, applicationId } = req.params;

  if (!status || !jobId || !applicationId) {
    return next(new Error("Missing required parameters", { cause: 400 }));
  }

  if (!Object.values(ApplicationStatus).includes(status)) {
    return next(
      new Error(
        `Invalid status. Must be one of: ${Object.values(
          ApplicationStatus
        ).join(", ")}`,
        { cause: 400 }
      )
    );
  }

  const job = await jobModel
    .findById(jobId)
    .populate({
      path: "applications.userId",
      select: "email firstName lastName",
    })
    .lean();

  if (!job) {
    return next(new Error("Job not found", { cause: 404 }));
  }

  const isAuthorized =
    (req.user.role === UserRole.COMPANYHR ||
      req.user.role === UserRole.COMPANYOWNER) &&
    job.companyId.toString() === req.user.companyId.toString();

  if (!isAuthorized) {
    return next(
      new Error("Not authorized to update application status", { cause: 403 })
    );
  }

  const application = job.applications?.find(
    (app) => app._id.toString() === applicationId
  );
  if (!application) {
    return next(new Error("Application not found", { cause: 404 }));
  }

  const updatedJob = await jobModel
    .findOneAndUpdate(
      {
        _id: jobId,
        "applications._id": applicationId,
      },
      {
        $set: {
          "applications.$.status": status,
          "applications.$.updatedAt": new Date(),
        },
      },
      { new: true }
    )
    .populate({
      path: "applications.userId",
      select: "email firstName lastName",
    });

  if (!updatedJob) {
    return next(
      new Error("Failed to update application status", { cause: 500 })
    );
  }

  const updatedApplication = updatedJob.applications.find(
    (app) => app._id.toString() === applicationId
  );

  const emailTemplate = {
    subject:
      status === ApplicationStatus.ACCEPTED
        ? "Congratulations! Your Job Application Has Been Accepted"
        : "Update on Your Job Application",
    html:
      status === ApplicationStatus.ACCEPTED
        ? `<h1>Congratulations!</h1>
         <p>Your application for the position of ${updatedJob.jobTitle} has been accepted.</p>
         <p>We will contact you shortly with next steps.</p>
         <br>
         <p>Best regards,</p>
         <p>Job Search App Team</p>`
        : `<h1>Dear Applicant,</h1>
         <p>Thank you for your interest in the position of ${updatedJob.jobTitle}.</p>
         <p>Unfortunately, we have decided to move forward with other candidates.</p>
         <p>We wish you the best in your job search.</p>
         <br>
         <p>Best regards,</p>
         <p>Job Search App Team</p>`,
  };

  eventEmitter.emit("sendEmail", {
    email: updatedApplication.userId.email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
  });

  return res.status(200).json({
    message: `Application ${status} successfully`,
    application: updatedApplication,
  });
});

// --------- Delete Job ---------
export const deleteJob = asyncHandler(async (req, res, next) => {
  const job = await jobModel.findById(req.params.id);
  if (!job) return next(new Error("Job not found", { cause: 404 }));

  if (
    (req.user.role !== UserRole.COMPANYHR &&
      req.user.role !== UserRole.COMPANYOWNER) ||
    job.companyId.toString() !== req.user.companyId.toString()
  ) {
    return next(new Error("Not authorized to delete this job", { cause: 403 }));
  }

  await jobModel.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Job deleted successfully" });
});
