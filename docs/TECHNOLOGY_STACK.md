# Technology Stack Document: MedEase

This document serves as the definitive technical specification for the **MedEase** project. It outlines the application frameworks, the AWS-native cloud infrastructure, and the automation tools used for deployment.

---

## 1. Core Application Frameworks (MERN)
The application follows a decoupled architecture using the MERN stack for high performance and scalability.

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | **React.js** | Functional components with Hooks for the user interface. |
| **Styling** | **Tailwind CSS** | Utility-first styling for a responsive, mobile-first design. |
| **Backend** | **Node.js & Express** | RESTful API handling business logic and routing. |
| **Database** | **MongoDB / DocumentDB** | NoSQL document storage for flexible medical data schemas. |
| **State Management** | **React Context API** | Global state management for user authentication and UI themes. |

---

## 2. AWS Native Infrastructure
The project is deployed using a serverless-first approach on AWS to ensure high availability and minimize operational overhead.

| Component | AWS Service | Description |
| :--- | :--- | :--- |
| **Compute** | **AWS Fargate (ECS)** | Serverless container orchestration for the backend API. |
| **Static Hosting** | **Amazon S3** | Secure bucket storage for the React production build. |
| **CDN** | **Amazon CloudFront** | Global edge delivery of the frontend with SSL (ACM). |
| **Database** | **Amazon DocumentDB** | Fully managed, MongoDB-compatible database service. |
| **Registry** | **Amazon ECR** | Private Docker registry for backend container images. |
| **Networking** | **Amazon VPC** | Isolated network with Public/Private subnets across multiple AZs. |
| **Security** | **AWS Secrets Manager** | Encrypted storage for DB credentials and API keys. |

---

## 3. DevOps & Automation (CI/CD & IaC)
Automation is handled through industry-standard "Infrastructure as Code" and automated pipelines.

### Infrastructure as Code (IaC)
* **Tool:** **Terraform**
* **Purpose:** Provisioning and managing all AWS resources (VPC, ECS, S3, etc.).
* **State Management:** Remote state stored in **Amazon S3** with **DynamoDB** for state locking.
* **Approach:** Modular Terraform design to separate networking, compute, and data layers.

### Continuous Integration & Deployment (CI/CD)
* **Tool:** **GitHub Actions**
* **Infrastructure Pipeline:** Triggered on changes to `.tf` files to run `terraform plan` and `apply`.
* **App Pipeline (Backend):** Automates Docker build, tagging, ECR push, and ECS service update.
* **App Pipeline (Frontend):** Automates the React build process and S3 sync with CloudFront cache invalidation.

---

## 4. Development & Security Tools
| Tool | Purpose |
| :--- | :--- |
| **Git/GitHub** | Version control and source code management. |
| **Docker** | Containerization of the backend environment. |
| **JSON Web Tokens (JWT)** | Secure, stateless authentication for API endpoints. |
| **Postman** | API testing and documentation. |
| **Checkov / TFLint** | Static analysis for Terraform security and best practices. |

---

## 5. Summary Architecture Overview
* **Architecture Pattern:** Micro-services ready, Containerized REST API.
* **Deployment Model:** AWS Cloud Native (Serverless Fargate).
* **Workflow:** Git-based automation (GitOps) via GitHub Actions and Terraform.