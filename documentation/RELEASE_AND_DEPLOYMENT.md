# Release

Go to release section of Jira.

Look at all the tickets assigned to the release. Moves ones that aren't "Ready for release"/"Closed" to the next release and change their "Fix Version" field to the next one.

On your local machine checkout the main branch of the Github repository that contains the GUI application.

Check the tickets' changes are present, that there are no errors in the browser or server logs and that all the normal usecases work as expected.



Run `npm version patch/minor/major`.

To check and fix vulnerabilities run: `npm audit fix`.

Create the release branch `git checkout -b release/[name of GUI]/[version]`.

Git add the changes. Push the branch.

Raise the PR for it, add the release and associated GUI tag.

Github create new release, title: Jira release name, exact. E.G. `@aliceo2/bookkeeping@1.15.0`

Copy release notes from Jira, replace H2 with H4 and remove the title.

Release notes developer text should be rewritten to user-friendly text, move subtasks to be grdouped under their parent task. Developer oriented text can be removed.

Github workflow covers specific logic based on release name.

If name is wrong the Github action will fail. To fix this: delete the release AND the tag and start over.

When you click make release it will deploy the NPM module and other related actions see the workflow if want more detail.

Github workflow publishes to npm
Github workflow publishes to CERN S3

This workflow takes care of the following steps:
1. Publishes the NPM module to the ALICE O2 NPM registry. This is for people installing outside of CERN.
2. Installs production dependencies and creates the dedicated CERN release publishes it to our private CERN NPM registry called s3 (cern.s3.registry - linux training section).
3. Creates the Tarball with `NPM pack` and attaches it to the release's assets via the GH CLI. This can be used to manually install the release at P2 if needed.

If at this point everything is green in GitHub actions the release is done, the GitHub release package is created.

Click on the release button in Jira.

Diagram:
![Release Diagram](./images/release_diagram.svg)

---
# Deployment

To deploy a release the version number/s must be changed in [system configuration repository](https://gitlab.cern.ch/AliceO2Group/system-configuration/-/blob/dev/ansible/roles/basevars/vars/main.yml?ref_type=heads).

Commit then and create a new branch with the name `[gui/${applicationNames}/${version}]`, **NO SLASH** in name allowed as it will cause the flp-setup-tool to fail.

Copy the release notes into the PR from the GitHub release, add yourself as the creator and O2-FLP Group Leader as reviewer.

Sync with the people at P2 from an accelerator and detector point of view: make sure no runs are going on and the detectors are in a safe state.

If something is merged after a pipeline has started: then we need to rebase the PR and that pipeline will not be useful anymore. Any pipeline with 5 stages means someone has already triggered a deployment. Make the PR and assign it to Vasco and expect him to see the train of PRs to be merged so we won't trigger a new pipeline in this case we will wait for Vasco to do.  Go back to PR and set it to auto-merge.

Go to pipelines in GitLab and start the deployment pipeline, you don't need to change any pipeline paramters.

Once the PR is merged the release there is nothing else left to be done and when there is a slot free the deployment will happen.

When GUIs is green on pipeline can see release and can check version is new one in about of the application and play with the new features.

Diagram:
![Deployment Diagram](./images/deployment_diagram.svg)

