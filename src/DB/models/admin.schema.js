import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type User {
    _id: ID!
    firstName: String!
    lastName: String!
    email: String!
    role: String!
    bannedAt: String
    createdAt: String!
    updatedAt: String!
  }

  type Company {
    _id: ID!
    companyName: String!
    description: String
    industry: String!
    address: String!
    numberOfEmployees: Int
    companyHRs: [User]
    approved: Boolean!
    approvedAt: String
    bannedAt: String
    createdAt: String!
    updatedAt: String!
  }

  type DashboardData {
    users: [User]!
    companies: [Company]!
  }

  type Query {
    getDashboardData: DashboardData!
  }

  type Mutation {
    banUser(userId: ID!): User!
    banCompany(companyId: ID!): Company!
    approveCompany(companyId: ID!): Company!
  }
`;
