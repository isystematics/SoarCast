# SoarCast
Security Orchestration Automation Response + Continuous Application Security Testing = SoarCast!

## Introduction to SoarCast

[![Slack](https://kubearmor.herokuapp.com/badge.svg)](https://kubearmor.herokuapp.com)
[![Discussions](https://img.shields.io/badge/Got%20Questions%3F-Chat-Violet)](https://github.com/isystematics/SoarCast/discussions)

SoarCast is an orchestration and continuous execution platform whose name is derived by concatenation of two product categories it emulates.  While SoarCast can be used for any purpose it was designed to perform Continuous Application Security Testing (CAST) and  Security Orchestration Automation and Response (SOAR).

SoarCast operates as an authentication proxy to SaltStack enabling delegated administration of module execution in instances where direct access to the Master is undesirable.  It also enables SaltStack to leverage Hashicop Vault to facilitate runtime secrets injection to modules.  This reduces secret sprawl and provides a centralized place where secrets can be defined and mapped to the modules that need to consume them.  When a secret needs to be rotated it only needs to change in one place.  Additionally it enables orchestration between modules where outputs from one module can be passed as input to the next.  The operator can optionally apply conditional logic based on passed values to alter program flow or change variables dynamically based on output.


## Functionality Overview

* Application & User Authentication

SoarCast allows the user to create permission boundaries called Apps.  An App receives a special API endpoint where a 3rd party integration can create users, these can be scoped to a least privileged set of functions and secrets. This provides a convenient way to limit exposure and terminate an App without impacting other Apps should the need arise to revoke access.  

Each user registered with an app has a unique authentication token giving fine grained access control per user/per app and provides the ability to terminate access at either level.
Define API Endpoints mapped to execution modules
Securely devine API endpoints with least privilege principles in mind and provide a way to validate every parameter should the user choose to.

The same fine grained access controls can be applied to an API where only a certain user or app may consume a given API.

* Scheduling

Configure modules to run on a schedule.

* Audit and logging

SoarCast provides logging and visibility into the return status of states/modules executed on the Salt Master.

* Secure secret storage

Hashicorp Vault stores secrets providing a more secure storage option than Pillar files.

* Secret Mapping

Define secrets once and map to many modules. This drastically reduces the number of places the same secret has to be stored.  When a secret is updated everything that references it is automatically updated.

* Secret Request

Secrets can be securely solicited via email.

* Runners

Runners represent a single execution of a module triggered either via an API call or performed by the system on a schedule.  

* Playbooks

Playbooks allow modules to be chained together to pass output from one module into the next.  Modules can be ordered and conditional logic applied to the return output from a module to change the flow of execution based on values ret


## Community

### Monthly Scrum

* When: Every 3rd Wednesday 1-2 pm UTC−05:00
* Where: [Zoom Link](https://us02web.zoom.us/j/5013008459?pwd=LzhGdk42T05QZEM5T2pmYzhYUEZuQT09)
* Minutes: [Document](https://docs.google.com/document/d/e/2PACX-1vTXzCB5uwlCDCVcoHkIhaBOV6SzFBXU7YizG5ONWcyUoZez4qAGAn2REzGc1x1KML5KTce0lyk80upu/pub)
