# Branch Protection Rules

To ensure PR validation checks are required before merging, configure the following branch protection rules for the `main` branch.

## Required Status Checks

Navigate to: **Settings** → **Branches** → **Branch protection rules** → **Add rule** (or edit existing rule for `main`)

### Enable the following settings:

1. **Require status checks to pass before merging**
   - Check this box
   - **Require branches to be up to date before merging** (optional but recommended)

2. **Required status checks:**
   - `Check PR requirements` (from pr-validation.yml)
   - `Format with Prettier` (from format-check.yml)

3. **Require a pull request before merging**
   - Check this box
   - **Require approvals**: Set to at least 1 (recommended)

4. **Do not allow bypassing the above settings**
   - Check this box to prevent admins from bypassing these rules

## Manual Setup Steps

1. Go to your repository on GitHub
2. Click **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule**
4. In "Branch name pattern", enter: `main`
5. Check **Require status checks to pass before merging**
6. Search for and select these status checks:
   - `Check PR requirements`
   - `Format with Prettier`
7. Click **Create** (or **Save changes** if editing)

## Validation Checks

The following checks must pass before a PR can be merged:

- ✅ **PR Title Format**: Must follow conventional commit format (e.g., `feat(scope): description`)
- ✅ **Issue Linkage**: PR description must include `Fixes #123`, `Closes #123`, or `Resolves #123`
- ✅ **Code Formatting**: All changed files must be properly formatted with Prettier
- ✅ **Auto-assignment**: PR author is automatically assigned if no assignee exists

## Notes

- The `Check PR requirements` job will fail if any validation check fails
- Branch protection rules can only be configured through the GitHub web interface
- Administrators can optionally be allowed to bypass these rules (not recommended)
