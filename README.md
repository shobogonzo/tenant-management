# Tenant Management Backend Reference Architecture

[![dev](https://github.com/shobogonzo/tenant-management/actions/workflows/dev.yml/badge.svg)](https://github.com/shobogonzo/tenant-management/actions/workflows/dev.yml)

Boilerplate API, DynamoDB table, and user pool for a tenant management app

## Onboarding flow

### Sysadmin user registers tenant in app

- Save tenant item collection to DynamoDB
  - Tenant status 'Onboarding'
  - Tenant admin user status 'Creating'

## TODO

- On `PreSignUp_AdminCreateUser` event
  - Create tenant admin Cognito account
  - Tenant admin user status 'Unconfirmed'
