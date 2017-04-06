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
    <policy-identifier>
  ],
  "inline-policies": [
    <policy-definition>
  ],
  "trust-relationship": {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "<service-identifier>"
      },
      "Action": "sts:AssumeRole"
    }]
  }
}
```

The *managed-policies* section contains a list of identifiers of IAM policies already deployed in AWS associated to the role. During the
deployment of a role, Lager will look for policies matching the identifiers in *managed-policies*, trying combinations with the *environment* and the *stage*
options:

*   `<environment>_<identifier>_<stage>`
*   `<environment>_<identifier>`
*   `<identifier>`

The *inline-policies* section contains a list of AIM policy definitions associated to the role.

The *trust-relationship* section contains the policy that describe the trusted entities that can assume the role
