# MedEase

A comprehensive, cloud-based hospital management system.

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

MedEase is a full-stack hospital management application designed to streamline medical operations and patient care. The project includes:

- **Frontend**: Modern web interface for hospital staff and patients
- **Backend**: RESTful API services for data management
- **Infrastructure**: Terraform-managed cloud resources for scalability

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
├── frontend/              # Frontend application
├── backend/               # Backend services
├── terraform/             # Infrastructure as Code
└── README.md
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **Terraform** (v1.0 or higher) - for infrastructure management
- **Docker** (optional, for containerized development)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/medease.git
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
DATABASE_URL=your_database_url
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

# Backend
cd backend
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
git clone https://github.com/yourusername/medease.git
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

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

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

- ✅ **PR Title Format**: Must follow conventional commit format
- ✅ **Issue Linkage**: Must reference an issue
- ✅ **Code Formatting**: Automatically formatted with Prettier
- ✅ **Assignee**: PR author is auto-assigned

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

## Workflows & Automation

This project uses GitHub Actions for automation:

### Automatic Workflows

- **Auto-Format Code**: Formats changed files with Prettier
- **Auto-Label PRs**: Labels based on files changed and PR title
- **Validate PR**: Checks title format and issue linkage
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

- Create an [issue](https://github.com/yourusername/medease/issues) for bug reports or feature requests
- Check existing issues before creating new ones
- Use appropriate issue templates

## License

[Add your license here]

---

Built with ❤️ by the MedEase team
