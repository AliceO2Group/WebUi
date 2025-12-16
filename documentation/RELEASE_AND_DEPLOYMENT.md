# Release

## 1. Prepare the Jira Release
1. Go to Release section of your Jira project
2. Review all the tickets assigned to the release
3. Move any ticket not in "Ready for release" or "Closed" to the next release and update its Fix Version field
4. Use the bulk editor from Jira to move all tickets from "Ready for release" to "Closed"


## 2. Validate the Release Locally
1. Checkout the default (`dev/main`) branch of the Github repository that contains the GUI application. Make sure to pull all latest changes
2. Verify that all changes related to the release tickets are present
3. Validate functionality:
   - No errors in the browser console
   - No errors in the server logs
   - All common use cases work as expected


## 3. Create Release Branch and PR
1. Create a release branch: `git checkout -b release/[BKP/QCG/COG/ILG/FRM]/[version]`
2. Update the version number: `npm version patch/minor/major`
3. Check and fix known vulnerabilities: `npm audit fix`
4. Stage and commit the changes
5. Push the branch to the remote repository
6. Open a Pull Request (PR) for the release branch
7. Add the release and associated GUI tag to the PR
8. Merge the PR once tests have passed and one approval has been received

## 5. Create the GitHub Release
1. Create new GitHub release from the default branch created in the previous step.
   -  Title of the release must match exactly the Jira release name, e.g., `@aliceo2/bookkeeping@1.15.0`
2. Copy the release notes from Jira and edit them:
   - Replace H2 headings with H4
   - Remove the title
   - Rewrite developer text should be rewritten to user-friendly text
   - Group subtasks under their parents tasks
   - Remove developer oriented text

> [!CAUTION]
> Github workflow covers specific logic based on release name.
> If name is wrong the Github action will fail. To fix this: delete the release AND the tag and start over.

## 6. GitHub Release Workflow (Automated)
When you click "Create release", GitHub Actions will automatically:
1. Publish the NPM module to the ALICE O2 NPM registry. This is for people installing outside of CERN
2. Install production dependencies and publish the dedicated CERN release to our private CERN NPM registry called s3 (cern.s3.registry - linux training section)
3. Create the Tarball with `NPM pack` and attach it to the GitHub release's assets via the GH CLI. (This can be used to manually install the release if needed)
4. If at this point everything is green in GitHub actions the release is done, the GitHub release package is created
5. Click "Release" in Jira to finalise the release

## Diagram
![Release Diagram](./images/release_diagram.svg)

---
# Deployment

## 1. Update System Configuration and Create PR
1. To deploy a release the version number/s must be changed in [system configuration repository](https://gitlab.cern.ch/AliceO2Group/system-configuration/-/blob/dev/ansible/roles/basevars/vars/main.yml?ref_type=heads)
2. Commit then and create a new branch and PR (named `[gui/<prefix_gui>/<release_version>]`) and branch with the name `gui-${applicationNames}-${version}`, **NO SLASH** in name allowed for the branch name as it will cause the flp-setup-tool to fail
3. Copy the release notes into the PR from the GitHub release, add yourself as the creator and O2-FLP Group Leader as reviewer
4. Check if any existing pipelines are already running.
   1. If there are, do not start a pipeline and trust that the O2-FLP group leader will take care of the train of PRs.
   2. Go to pipelines in GitLab and start the default pipeline FOR YOUR BRANCH, you don't need to change any pipeline parameters.
   3. Go back to the PR and set it to auto-merge for when pipeline will be successful. 
5. Once the release PR is merged there is nothing else left to be done and when there is a slot free the deployment will happen

## 3. Post-Deployment Verification
1. Once the SRC (Software Release Coordinator) of FLP gives the green light for software verification, ensure the GUI in specified environment runs as expected by:
   1. Checking the GUI version has been updated
   2. Briefly test that the changes are working as expected

## Diagram
![Deployment Diagram](./images/deployment_diagram.svg)