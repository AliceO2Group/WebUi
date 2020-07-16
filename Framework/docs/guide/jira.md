# JIRA Service
Creates issues in [JIRA](https://www.atlassian.com/software/jira) ticketing system.

#### Import the module
```js
require('@aliceo2/web-ui').Jira
```

#### Create an instance
```js
new Jira({url: URL, serviceAccount: {user: ACCOUNT_USER, pass: ACCOUNT_PASS}, projectId: PROJECT_ID});
```

Where:
 - `URL` - full URL to JIRA REST API create issue path (eg. `https://alice.its.cern.ch/jira/rest/api/2/issue`)
 - `ACCOUNT_USER` - CERN service account username
 - `ACCOUNT_PASS` - CERN service account password
 - `PROJECT_ID` - JIRA project ID (where issue are created)

### Example

```js
const Jira = require('@aliceo2/web-ui').Jira;
const jira = new Jira({url: 'http://localhost/jira/rest/api/2/issue', accountUser: 'test', accountPass: 'test', projectId: 1});

/// create bug issue
jira.createBugIssue('alice', 'bob', 'Run fails', 'Due to unknown reasons...')
  .then((details) => console.log('Created:', details.key));
```
