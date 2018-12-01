---
layout: post
title: "Walkthrough: Assuming an AWS Role"
subtitle: Step-by-step guide
---


For a high-level primer on AWS roles, see [What are AWS roles?]({{ site.baseurl }}{% post_url 2018-11-25-aws-roles %})

A client has created a role that provides access to an S3 bucket for an app called MyApp. In the trust policy, they specified our root account ID as a valid accessor of the role.

They provide us with a policy definition that allows us to assume a role.

```
{
  "Version": "2012-10-17",
  "Statement": {
    "Effect": "Allow",
    "Action": "sts:AssumeRole",
    "Resource": "arn:aws:iam::<ACCOUNT_ID>:role/MyApp/MyS3Access"
  }
}
```

### Create a policy to assume the role

First we need to create a new managed policy using this definition.

Go to the IAM dashboard and click on the "Policies" tab. Click "Create policy" at the top of the screen, switch to the tab that says "JSON", and paste in the policy.

<img src="/public/images/aws-policy.png" alt="Adding the managed policy" style="width: 500px; display: block;">

Proceed to the next step and give the policy a descriptive name.

<img src="/public/images/aws-policy-review.png" alt="Adding the managed policy" style="width: 600px; display: block;">

### Creating a group

Let's go to the "Groups" page and create a group called `developers`. We'll grant all developers the permission to assume the role.

<img src="/public/images/aws-group-developers.png" alt="Adding the developers group" style="width: 500px; display: block;">

Before finalizing the group, we're presented with available policies to attach to it. Let's filter by __Customer Managed policies__.

<img src="/public/images/aws-policy-filter.png" alt="Filtering for managed policies" style="width: 600px; display: block;">

And our new policy appears!

<img src="/public/images/aws-policy-filter-2.png" alt="Viewing the managed policies" style="width: 600px; display: block;">

Let's attach that policy and go to the next step to finish creating the group.

You'll be dropped back at the groups listing, where you'll find the new group we've created.

<img src="/public/images/aws-groups-list.png" alt="Viewing groups" style="width: 600px; display: block;">

Now, let's add an IAM user who will belong to this group. I'll call this user `natan` and I'll use it for day-to-day development purposes. After setting the username, you'll have the option to add the user to group. Let's add this user to the `developers` group.

<img src="/public/images/aws-add-user-to-group.png" alt="Adding the new user to the developer's group" style="width: 600px; display: block;">


Once the user is created, you should see from their user page that they belong to one group, `developers`, and that they have the `MyAppS3Access` permission attached.

### Assuming the role from the CLI

For a refresher on the `assume-role` command, check out the [What are AWS roles?]({{ site.baseurl }}{% post_url 2018-11-25-aws-roles %}#assuming-the-role) primer.

Make sure you're authenticated as an IAM user in the developers group in the CLI. You'll be able to assume the role now:

```
aws sts assume-role --role-arn "arn:aws:iam::<ACCOUNT_ID>:role/MyApp/MyS3Access" --role-session-name "FirstSession" --external-id "<external-id>" 
```

You'll receive back three important credentials:
- access key ID
- secret access key
- session token

Open `~/.aws/credentials` and add these credentials in a new profile:

```
[default]
aws_access_key_id = <DEFAULT_ACCESS_KEY_ID>
aws_secret_access_key = <DEFAULT_SECRET_ACCESS_KEY>

# Add a new profile
[new-profile]
aws_access_key_id = <ACCESS_KEY_ID>
aws_secret_access_key = <SECRET_ACCESS_KEY>
aws_session_token = <SESSION_TOKEN>
```

Now, using the new profile credentials will allow to use the role's permissions.
```
aws s3 ls s3://path/to/bucket/ --profile new-profile
```

When those credentials expire, you'll need to assume the role again and update `~/.aws/credentials`.