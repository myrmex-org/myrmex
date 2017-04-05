---
title: Management of policies with @lager/iam plugin
keywords: lager, iam
tags: [iam]
summary: "The @lager/iam plugin allows to define and publish IAM policies"
sidebar: iam_sidebar
permalink: iam-policies.html
folder: iam
---

The policies managed by Lager are nothing more than AWS policy definitions stored as JSON file. This allows to manage the permissions needed by your
application alongside the code.

Every time Lager has to deploy a policy, it checks if it has to be created or updated or not changed and perform the appropriate action. If a policy already has 5 version (the maximum allowed by AWS), the oldest one will be deleted (unless it as been defined as the default one). 
