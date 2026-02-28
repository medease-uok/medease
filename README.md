# MedEase

A cloud-based hospital management system designed for Sri Lankan government hospitals.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development](#development)
- [Contributing](#contributing)
- [Workflows & Automation](#workflows--automation)
- [License](#license)

## Overview

MedEase is a web-based hospital management system that streamlines patient care, appointment scheduling, medical record management, and hospital resource tracking for government hospitals in Sri Lanka. It reduces waiting times, enhances staff efficiency, and improves healthcare accessibility.

### Key Features

- **Appointment Scheduling** - Book, reschedule, and cancel appointments with real-time doctor availability
- **Electronic Medical Records (EMR)** - Secure digital patient records, prescriptions, and medical history
- **Lab Reports** - Upload, view, and manage laboratory test results
- **Prescription Management** - Electronic prescriptions with pharmacy integration
- **Billing & Payments** - Hela Pay gateway integration for secure transactions
- **Inventory Management** - Track medications, equipment, and medical supplies
- **Staff Scheduling** - Shift management for doctors, nurses, and technicians
- **Notifications** - SMS and email alerts for appointments, prescriptions, and reports

### User Roles

| Role | Access |
|------|--------|
| **Patient** | Book appointments, view records/reports/prescriptions |
| **Doctor** | Manage appointments, access patient records, write prescriptions |
| **Nurse** | Assist patient care, monitor vitals, update records |
| **Lab Technician** | Upload and manage lab test results |
| **Pharmacist** | Dispense medications, manage inventory |
| **Admin** | Manage users, generate reports, system administration |

### Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js & Express (RESTful API)
- **Database**: PostgreSQL (RDS)
- **Cloud**: AWS (Fargate, S3, CloudFront, API Gateway, Cognito)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions

## Project Structure

```
medease/
├── .github/
│   ├── workflows/          # GitHub Actions workflows
│   ├── ISSUE_TEMPLATE/     # Issue templates
│   └── pull_request_template.md
├── config/                 # Configuration files
│   ├── labels.yml         # GitHub labels configuration
│   ├── labeler.yml        # Auto-labeling rules
│   └── prettier.json      # Code formatting rules
├── docs/                  # Project documentation
├── frontend/              # React.js frontend application
├── backend/               # Node.js & Express backend API
├── terraform/             # Infrastructure as Code
└── README.md
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v24.10.0 (installed)
- **npm** v11.6.0 (installed)
- **React** v19.2.4 (installed in frontend/)
- **Express.js** v5.2.1 (installed in backend/)
- **Git**
- **Terraform** (v1.0 or higher) - for infrastructure management
- **Docker** (optional, for containerized development)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/medease-uok/medease.git
cd medease
```

### 2. Install Dependencies

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 3. Environment Configuration

Create `.env` files in the appropriate directories:

#### Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:3000
```

#### Backend `.env`
```env
PORT=3000
NODE_ENV=development
```

### 4. Run the Application

#### Frontend
```bash
cd frontend
npm start
```

#### Backend
```bash
cd backend
npm run dev
```

### 5. Infrastructure Setup (Optional)

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Development

### Code Style

This project uses Prettier for code formatting. All code is automatically formatted when you create a pull request.

Manual formatting:
```bash
npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,scss,md,yml,yaml}"
```

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build
```

## Contributing

We welcome contributions! Please follow these guidelines:

### 1. Create an Issue

Before starting work, create an issue describing:
- **Bug reports**: Steps to reproduce, expected vs actual behavior
- **Feature requests**: Use case, proposed solution
- **Documentation**: What needs to be added or clarified

Use our [issue templates](.github/ISSUE_TEMPLATE/) for consistent reporting.

### 2. Fork and Branch

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/medease-uok/medease.git
cd medease
git checkout -b feat/your-feature-name
```

### 3. Make Your Changes

- Write clean, maintainable code
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Keep commits atomic and well-described

### 4. Commit Guidelines

**IMPORTANT: Include Jira Reference**

All commits should reference a Jira issue for traceability:

```bash
git commit -m "MEDEASE-123: Add user authentication"
git commit -m "MEDEASE-456: Fix payment validation bug"
git commit -m "MEDEASE-789: Update API documentation"
```

Alternatively, follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test changes
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

**Examples:**
```bash
git commit -m "feat(auth): add user login functionality"
git commit -m "fix(api): resolve null pointer in user service"
git commit -m "docs: update installation instructions"
```

**Setup Commit Template (Optional):**
```bash
git config --local commit.template .gitmessage
```
This will provide a template when you run `git commit`.

### 5. Push and Create Pull Request

```bash
git push origin feat/your-feature-name
```

Then create a PR on GitHub with:
- **Title**: Follow conventional commit format (e.g., `feat(api): add user endpoint`)
- **Description**: Clear explanation of changes
- **Link**: Reference the issue with `Fixes #123`, `Closes #123`, or `Resolves #123`

### Pull Request Requirements

All PRs must pass the following checks:

- **PR Title Format**: Must follow conventional commit format
- **Issue Linkage**: Must reference an issue
- **Code Formatting**: Automatically formatted with Prettier
- **Assignee**: PR author is auto-assigned

### Code Review Process

1. Automated checks run on every PR
2. Request a code review from maintainers
3. Address feedback and push changes
4. Once approved and checks pass, your PR will be merged
5. Branch is automatically deleted after merge

### Getting AI Code Review

You can request an AI-powered code review by commenting on your PR:

```
claude-review
```

This will trigger Claude AI to review your changes and provide feedback.

## Jira Integration

This repository is integrated with Jira for seamless project tracking:

**Jira Board:** [https://medease-uok.atlassian.net](https://medease-uok.atlassian.net)

### Automatic Features

When you include Jira issue keys (e.g., `MEDEASE-123`) in your commits and PRs:

- **Commits appear in Jira**: Every commit with a Jira key shows up in the Development panel
- **PRs link automatically**: Pull requests are linked to Jira issues
- **Status tracking**: Development progress is visible in Jira
- **Auto-labeling**: PRs with Jira references get `jira-linked` label

### Smart Commits

Perform Jira actions directly from commit messages:

```bash
# Add comment to Jira issue
git commit -m "MEDEASE-123 #comment Fixed authentication bug"

# Log work time
git commit -m "MEDEASE-123 #time 2h 30m Debugging API"

# Close Jira issue
git commit -m "MEDEASE-123 #close Completed feature implementation"
```

### PR Requirements

All PRs must:
- Include Jira reference (MEDEASE-XXX) in title or description
- Link to related GitHub issue (if applicable)
- Follow conventional commit format OR use Jira key format

**Valid PR Titles:**
- `MEDEASE-123: Add authentication feature`
- `feat(auth): implement JWT authentication`

**Invalid PR Titles:**
- `Added new feature` (Missing Jira reference)

See [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) for detailed workflow guide.

## Workflows & Automation

This project uses GitHub Actions for automation:

### Automatic Workflows

- **Auto-Format Code**: Formats changed files with Prettier
- **Auto-Label PRs**: Labels based on files changed and PR title
- **Validate PR**: Checks title format, issue linkage, and Jira reference
- **Jira Integration**: Links commits and PRs to Jira issues
- **Review Time Estimate**: Adds labels based on PR size
- **Branch Cleanup**: Deletes branches after merge
- **Claude AI Review**: On-demand code review (comment `claude-review`)

### Manual Workflows

- **Sync Labels**: Updates repository labels from config

See [.github/workflows/](.github/workflows/) for workflow details.

## Branch Protection

The `main` branch is protected with required status checks. See [.github/BRANCH_PROTECTION.md](.github/BRANCH_PROTECTION.md) for setup instructions.

Repository administrators can bypass checks when necessary for urgent fixes.

## Project Labels

We use labels to categorize issues and PRs:

**Type Labels:**
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `refactor` - Code refactoring
- `performance` - Performance improvements

**Component Labels:**
- `frontend` - Frontend changes
- `backend` - Backend changes
- `terraform` - Infrastructure changes
- `database` - Database related
- `api` - API changes

**Status Labels:**
- `wip` - Work in progress
- `ready-for-review` - Ready for review
- `needs-review` - Needs review
- `blocked` - Blocked by something

**Priority Labels:**
- `priority/critical` - Critical priority
- `priority/high` - High priority
- `priority/medium` - Medium priority
- `priority/low` - Low priority

**Review Time Labels:**
- `5min review` - Quick review (< 100 lines)
- `15min review` - Short review (100-499 lines)
- `30min review` - Medium review (500-1499 lines)
- `1hr review` - Long review (1500+ lines)

## Support

- Create an [issue](https://github.com/medease-uok/medease/issues) for bug reports or feature requests
- Check existing issues before creating new ones
- Use appropriate issue templates

## License

[Add your license here]

---

Built by the MedEase team at the University of Kelaniya, Sri Lanka
