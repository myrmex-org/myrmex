![Myrmex Logo](https://raw.githubusercontent.com/myrmex-org/myrmex/master/images/myrmex.png)

[![Build Status](https://travis-ci.org/myrmex-org/myrmex.svg)](https://travis-ci.org/myrmex-org/myrmex)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/249a9410043a43dca599d29f53a7bf98)](https://www.codacy.com/app/alexisno/myrmex?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=myrmex-org/myrmex&amp;utm_campaign=Badge_Grade)
[![Codecov](https://codecov.io/gh/myrmex-org/myrmex/branch/master/graph/badge.svg)](https://codecov.io/gh/myrmex-org/myrmex)

## What is it?

A serverless application framework.

> AWS Lambda + API Gateway + Swagger specification === *Myrmex*

Myrmex helps you to organize your code and deploy serverless applications in AWS. Its plugin system allows you to work with
AWS Lambda or API Gateway or both of them. The IAM plugin can help you to declare the IAM permissions your application needs
in your versionning system.

Control the IAM permissions needed to deploy your application. Allow several developers to publish different versions of the
project on the same AWS account.

Write your own plugins to enrich the command line, create higher level functionalities and integrate with other services.
Then share it as npm modules!

```
$ npm install -g myrmex
$ myrmex new my-serverless-project
$ cd my-serverless-project
$ myrmex -h
```

Documentation available at [https://myremx-org.github.io](https://myremx-org.github.io).

---

[MIT](LICENSE)
