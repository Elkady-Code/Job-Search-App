import { asyncHandler } from "../../utils/index.js";
import companyModel from "../../DB/models/company.schema.js";
import cloudinary from "../../utils/cloudinary/index.js";
import userModel from "../../DB/models/user.schema.js";
import { UserRole } from "../../utils/index.js";

// --------- Add Company ---------
export const addCompany = asyncHandler(async (req, res, next) => {
  const { companyName, companyEmail } = req.body;

  const existingCompany = await companyModel.findOne({
    $or: [{ companyName }, { companyEmail: companyEmail.toLowerCase() }],
  });

  if (existingCompany) {
    return next(
      new Error("Company name or email already exists", { cause: 409 })
    );
  }

  const company = await companyModel.create({
    ...req.body,
    createdBy: req.user._id,
    companyEmail: companyEmail.toLowerCase(),
    HRs: [req.user._id],
  });

  const updatedUser = await userModel.findByIdAndUpdate(
    req.user._id,
    {
      companyId: company._id,
      role: UserRole.COMPANY_HR,
    },
    { new: true }
  );

  return res.status(201).json({
    message: "Company created successfully",
    company,
    user: {
      id: updatedUser._id,
      role: updatedUser.role,
      companyId: updatedUser.companyId,
    },
  });
});

// --------- Update Company ---------
export const updateCompany = asyncHandler(async (req, res, next) => {
  const company = await companyModel.findById(req.params.companyId);
  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }
  if (company.createdBy.toString() !== req.user._id.toString()) {
    return next(new Error("Not authorized", { cause: 403 }));
  }

  if (req.user.role !== "admin" && req.body.legalAttachment) {
    delete req.body.legalAttachment;
  }

  const updatedCompany = await companyModel.findByIdAndUpdate(
    req.params.companyId,
    req.body,
    { new: true }
  );

  return res.json({
    message: "Company updated successfully",
    company: updatedCompany,
  });
});

// --------- Delete Company ---------
export const deleteCompany = asyncHandler(async (req, res, next) => {
  const company = await companyModel.findOne({
    _id: req.params.companyId,
    deletedAt: null,
  });

  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }

  if (
    req.user.role !== "admin" &&
    company.createdBy.toString() !== req.user._id.toString()
  ) {
    return next(new Error("Not authorized", { cause: 403 }));
  }

  company.deletedAt = new Date();
  await company.save();

  return res.status(200).json({
    message: "Company deleted successfully",
    company: {
      _id: company._id,
      companyName: company.companyName,
      deletedAt: company.deletedAt,
    },
  });
});

// --------- Search Company Via Id ---------
export const searchCompanies = asyncHandler(async (req, res, next) => {
  const { name } = req.query;
  const companies = await companyModel.find({
    companyName: { $regex: name, $options: "i" },
    deletedAt: null,
  });
  return res.json({ companies });
});

// --------- Upload Company Logo ---------
export const uploadLogo = asyncHandler(async (req, res, next) => {
  try {
    console.log("File received:", req.file);

    if (!req.file) {
      return next(new Error("Please upload an image", { cause: 400 }));
    }

    const company = await companyModel.findOne({
      _id: req.params.companyId,
      createdBy: req.user._id,
    });

    if (!company) {
      return next(new Error("Company not found", { cause: 404 }));
    }

    if (company.logo?.public_id) {
      try {
        await cloudinary.uploader.destroy(company.logo.public_id);
      } catch (error) {
        console.error("Error deleting old logo:", error);
      }
    }

    console.log("Attempting to upload file:", req.file.path);

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `jobsearch/companies/${company._id}/logo`,
      }
    );

    console.log("Upload successful:", { secure_url, public_id });

    company.logo = { secure_url, public_id };
    await company.save();

    return res.json({
      message: "Logo uploaded successfully",
      company: {
        logo: company.logo,
      },
    });
  } catch (error) {
    console.error("Full error details:", error);
    return next(
      new Error(`Error uploading image: ${error.message}`, { cause: 500 })
    );
  }
});

// --------- Upload Company Cover Picture ---------
export const uploadCoverPic = asyncHandler(async (req, res, next) => {
  try {
    console.log("File received:", req.file);

    if (!req.file) {
      return next(new Error("Please upload an image", { cause: 400 }));
    }

    const company = await companyModel.findOne({
      _id: req.params.companyId,
      createdBy: req.user._id,
    });

    if (!company) {
      return next(new Error("Company not found", { cause: 404 }));
    }

    if (company.coverPic?.public_id) {
      try {
        await cloudinary.uploader.destroy(company.coverPic.public_id);
      } catch (error) {
        console.error("Error deleting old cover picture:", error);
      }
    }

    console.log("Attempting to upload file:", req.file.path);

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `jobsearch/companies/${company._id}/cover`,
      }
    );

    console.log("Upload successful:", { secure_url, public_id });

    company.coverPic = { secure_url, public_id };
    await company.save();

    return res.json({
      message: "Cover picture uploaded successfully",
      company: {
        coverPic: company.coverPic,
      },
    });
  } catch (error) {
    console.error("Full error details:", error);
    return next(
      new Error(`Error uploading image: ${error.message}`, { cause: 500 })
    );
  }
});

// --------- Delete Company Logo ---------
export const deleteLogo = asyncHandler(async (req, res, next) => {
  const company = await companyModel.findOne({
    _id: req.params.companyId,
    createdBy: req.user._id,
  });
  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }
  if (!company.logo?.public_id) {
    return next(new Error("No logo to delete", { cause: 400 }));
  }
  await cloudinary.uploader.destroy(company.logo.public_id);
  company.logo = undefined;
  await company.save();
  return res.json({ message: "Logo deleted successfully" });
});

// --------- Delete Company Cover Picture ---------
export const deleteCoverPic = asyncHandler(async (req, res, next) => {
  const company = await companyModel.findOne({
    _id: req.params.companyId,
    createdBy: req.user._id,
  });
  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }
  if (!company.coverPic?.public_id) {
    return next(new Error("No cover picture to delete", { cause: 400 }));
  }
  await cloudinary.uploader.destroy(company.coverPic.public_id);
  company.coverPic = undefined;
  await company.save();
  return res.json({ message: "Cover picture deleted successfully" });
});

// --------- Get Company ---------
export const getCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const company = await companyModel
    .findOne({ _id: companyId, deletedAt: null })
    .populate({
      path: "jobs",
      match: { deletedAt: null },
      select: "jobTitle jobDescription jobLocation jobType salary requirements",
    });
  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }
  return res.status(200).json({
    message: "Success",
    company,
  });
});
