# Distributed-Log-Analysis-Framework
MapReduce framework built for performing log analysis over large, distributed system logs (e.g., from web servers, application traces, IoT devices), extracting useful insights (e.g., error rates, frequent access paths, IP usage patterns).  
System supports log splitting, distributed mapping, and result reduction.
## Project structure
### [Figma board link](https://www.figma.com/board/4VOwMDVzaCjXlxx79GB2qE/Untitled?t=h3ijaX7ESqqBWqBm-1)
## Commit Message Guidelines
### Commit Message Format
Each commit message consists of a **header**, a **body** and a **footer**.  The header has a special
format that includes a **type**, a **scope** and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
```

The **header** is mandatory and the **scope** of the header is optional (read below).

Examples of correct commit message:

```
docs(changelog): update changelog to beta.5
```
```
fix(release): need to depend on latest rxjs and zone.js

The version in our package.json gets copied to the one we publish, and users need the latest of these.
```



### Type
Must be one of the following:

* **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
* **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
* **docs**: Documentation only changes
* **feat**: A new feature
* **fix**: A bug fix
* **perf**: A code change that improves performance
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **test**: Adding missing tests or correcting existing tests

### Scope

The following is the current list of supported scopes (may be updated later:

* **main-node**
* **worker-node**
* **kafka**
* **dashboard**
* **db**
* **traefik**
* **k8s**
* **docker**


There are currently only one exception to the "use package name" rule:
* none/empty string: useful for `style`, `test` and `refactor` changes that are done across all packages (correct e.g. `style: add missing semicolons`)

### Subject
The subject contains a succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize the first letter
* no dot (.) at the end

### Body
Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

### Revert
If the commit reverts a previous commit, it should begin with `revert: `, followed by the header of the reverted commit. In the body it should say: `This reverts commit <hash>.`, where the hash is the SHA of the commit being reverted.