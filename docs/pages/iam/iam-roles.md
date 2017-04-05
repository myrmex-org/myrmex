---
title: Management of roles with @lager/iam plugin
keywords: lager, iam
tags: [iam]
summary: "The @lager/iam plugin allows to define and publish IAM roles"
sidebar: iam_sidebar
permalink: iam-roles.html
folder: iam
---

AWS roles can be configured with JSON files with `@lager/iam`. The structure looks like this:

```
{
  "description": "Description of the role",
  "managed-policies": [
    <PolicyIdentifier>
  ],
  "inline-policies": [
    <policy definition>
  ],
  "trust-relationship": {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "<service.that.can.use.the.role>"
      },
      "Action": "sts:AssumeRole"
    }]
  }
}
```
