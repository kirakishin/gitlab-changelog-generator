# gitlab-changelog-generator
Generate changelog based on Gitlab milestones and merge requests

# installation

```bash
$ npm install --saveDev gitlab-changelog-generator
```

then execute it with this params :
- url : gitlab url
- token : gitlab private access token
- destFile : changelog generated file path (relative path)
- projectId : the number or the name of your project id

example :

```bash
$ node gitlab-changelog-generator --url  https://yourgitlab --token XXXX --projectId group/name --destFile changelog.md
```