# Tenant Management Backend Reference Architecture

[![dev](https://github.com/shobogonzo/tenant-management/actions/workflows/dev.yml/badge.svg)](https://github.com/shobogonzo/tenant-management/actions/workflows/dev.yml)

Boilerplate API, DynamoDB table, and user pool for a tenant management app

## Onboarding flow

### Sysadmin user registers tenant in app (tenant name + admin user details)

- Save tenant item collection to DynamoDB
  - Tenant status 'Onboarding'
  - Admin user status 'Creating'
- On `PreSignUp_AdminCreateUser` event
  - Create tenant admin Cognito account

## TODO

- On `CustomMessage_AdminCreateUser` send email via SES with custom verification link (https://[appurl]/confirm-email?t=[confirmation_code])

### Admin user confirms user account via email link

- ConfirmEmail component calls API endpoint that invokes the ConfirmSignUp command
- On `PostConfirmation_ConfirmSignUp` updates tenant and admin user statuses to 'Active'
- User is redirected to app landing page
