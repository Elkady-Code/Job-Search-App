export class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.mongooseQuery = query;
  }

  paginate() {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  search(field) {
    const searchTerm = this.queryString.keyword || this.queryString.search;
    if (searchTerm) {
      let searchObj = {};

      if (field.includes(".")) {
        const [parentField, childField] = field.split(".");
        this.query = this.query.populate({
          path: parentField,
          match: { [childField]: { $regex: searchTerm, $options: "i" } },
        });
      } else {
        searchObj = {
          [field]: { $regex: searchTerm, $options: "i" },
        };
        this.mongooseQuery = { ...this.mongooseQuery, ...searchObj };
        this.query = this.query.find(searchObj);
      }
    }
    return this;
  }

  filter(allowedFields = []) {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "keyword"];
    excludedFields.forEach((field) => delete queryObj[field]);

    let filterObj = {};
    if (allowedFields.length > 0) {
      allowedFields.forEach((field) => {
        if (queryObj[field]) {
          filterObj[field] = queryObj[field];
        }
      });
    } else {
      filterObj = queryObj;
    }

    this.mongooseQuery = { ...this.mongooseQuery, ...filterObj };
    this.query = this.query.find(filterObj);
    return this;
  }
}
