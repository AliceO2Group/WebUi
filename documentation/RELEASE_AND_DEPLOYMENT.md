# Release

## 1. Prepare the Jira Release
1. Go to Release section of Jira
2. Review all the tickets assigned to the release
3. Move any ticket not in "Ready for release" or "Closed" to the next release and update its Fix Version field


## 2. Validate the Release Locally
1. Checkout the main branch of the Github repository that contains the GUI application
2. Verify that all changes related to the release tickets are present
3. Validate functionality:
   - No errors in the browser console
   - No errors in the server logs
   - All common use cases work as expected

## 3. Bump Version and Fix Vulnerabilities
1. Update the version number: `npm version patch/minor/major`
2. Check and fix known vulnerabilities: `npm audit fix`

## 4. Create Release Branch and PR
1. Create a release branch: `git checkout -b release/[name of GUI]/[version]`
2. Stage and commit the changes
3. Push the branch to the remote repository
4. Open a Pull Request (PR) for the release branch
5. Add the release and associated GUI tag to the PR

## 5. Create the GitHub Release
1. Create new GitHub release from the branch created in the previous step.
   -  Title of the release must match exactly the Jira release name, e.g., `@aliceo2/bookkeeping@1.15.0`
2. Copy the release notes from Jira and edit them:
   - Replace H2 headings with H4
   - Remove the title.
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
3. Create the Tarball with `NPM pack` and attach it to the GitHub release's assets via the GH CLI. (This can be used to manually install the release at P2 if needed)
4. If at this point everything is green in GitHub actions the release is done, the GitHub release package is created
5. Click "Release" in Jira to finalise the release

## Diagram
![Release Diagram](./images/release_diagram.svg)

---
# Deployment

## 1. Update System Configuration and Create PR
1. To deploy a release the version number/s must be changed in [system configuration repository](https://gitlab.cern.ch/AliceO2Group/system-configuration/-/blob/dev/ansible/roles/basevars/vars/main.yml?ref_type=heads)
2. Commit then and create a new branch with the name `[gui/${applicationNames}/${version}]`, **NO SLASH** in name allowed as it will cause the flp-setup-tool to fail
3. Copy the release notes into the PR from the GitHub release, add yourself as the creator and O2-FLP Group Leader as reviewer

If something is merged after a pipeline has started: then we need to rebase the PR and that pipeline will not be useful anymore. Any pipeline with 5 stages means someone has already triggered a deployment. Make the PR and assign it to O2 FLP Group Leader and expect him to see the train of PRs to be merged so we won't trigger a new pipeline in this case we will wait for O2 FLP Group Leader to do.  Go back to PR and set it to auto-merge.

## 2. Trigger Deployment Pipeline
1. Sync with the people at P2 from an accelerator and detector point of view: make sure no runs are going on and the detectors are in a safe state
2. Go to pipelines in GitLab and start the deployment pipeline, you don't need to change any pipeline parameters
3. Once the PR is merged the release there is nothing else left to be done and when there is a slot free the deployment will happen

## 3. Post-Deployment Verification
1. Confirm the GUI/s deployment statuses in the pipeline turn green
2. Verify the new version appears in the About section of the application 
3. test the newly deployed features

## Diagram
![Deployment Diagram](./images/deployment_diagram.svg)