# gitlab-changelog-generator
Generate changelog based on Gitlab milestones and merge requests

# installation

```bash
$ npm install --saveDev gitlab-changelog-generator
```

then execute it with this params :
- url : gitlab url
- token : gitlab private access token
- destFile : markdown changelog generated file
- projectId : the number or the name of your project id

example :

```bash
$ node gitlab-changelog-generator --url  https://yourgitlab --token XXXX --projectId group/name --destFile changelog.md
```