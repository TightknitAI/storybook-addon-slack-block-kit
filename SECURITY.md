# Security Policy

## Supported Versions

This package is published from `main`. Security fixes are released against the latest version on npm. Older versions are not patched.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Report vulnerabilities privately via GitHub's [private vulnerability reporting](https://github.com/TightknitAI/storybook-addon-slack-block-kit/security/advisories/new). This routes directly to the maintainers and is not publicly visible.

Include:

- A description of the issue and the impact
- Steps to reproduce (a minimal repro, proof-of-concept, or affected code path)
- The affected version(s)
- Any suggested mitigation, if known

You should receive an acknowledgement within 5 business days. We will keep you informed as we investigate and prepare a fix. Once a patch is released, we will publish a GitHub Security Advisory crediting the reporter unless anonymity is requested.

## Scope

In scope:

- The `@tightknitai/storybook-addon-slack-block-kit` package and its build output
- Code in this repository (`src/`, build configuration, Storybook manager/preview entrypoints)

Out of scope:

- Vulnerabilities in upstream dependencies — please report those to the respective projects. We track dependency advisories via Dependabot and update accordingly.
- Issues in Storybook itself or in `slack-blocks-to-jsx` — please file those with the respective upstream projects.
