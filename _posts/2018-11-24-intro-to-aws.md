---
layout: post
title: Intro to AWS
subtitle: An overview of users, groups, and policies
---


This article aims to consolidate the key information to get familiar with AWS. It assumes no background knowledge.

If you're an individual or on a team that's not already using AWS, start by signing up for an AWS developer account. You'll enter the standard sign up information as well as billing information, but you won't be charged for anything that follows.

## AWS Background
Once I got started, I realized my understanding of some key terms was not as solid as I thought. So, let's define a few of them.

__Root account__: This is the account that you just registered. You will generally have one root account for a team or organization. It has full root privileges and should primarily be used for any service tasks that can only be done as the root user, such as changing your AWS support plan and [other specific tasks](https://docs.aws.amazon.com/general/latest/gr/aws_tasks-that-require-root.html).

__IAM user__: A single root account can have many IAM users under its canopy, each with their own credentials. Each member of a team should have their own IAM user with specific permissions delegated to it. Individuals don't sign up as IAM users - IAM users are created from the IAM console by either the root user or an existing IAM user that has administrative permissions. <a href="#iam-users">More on this in the next section.</a>

__Resource__: Everything in AWS is a resource - IAM users, S3 buckets, EC2 instances, etc. Each resource is addressable by a string called an ARN. Users need permissions to read, write, or perform any other action on a resource.

__Permission/policy__: AWS sometimes uses _permission_ and _policy_ interchangeably - it would be proper to say that a permission is defined by a policy. A permission is the ability to perform an action on an AWS resource, and they can be assigned both to users and to groups. Policies are short, declarative documents in JSON format that describe what the permission allows. 

__Group__: AWS simplifies the process of adding the same permissions for many users by allowing you to create groups. Rather than attaching permissions to users directly, you apply them to the group. In a pinch, you can still add additional permissions to an individual IAM user directly, perhaps for a developer who needs special access to a specific resource.


## Root account vs. IAM users
<a class="anchor" id="iam-users"></a>

The account you've created is referred to as the __root account__. Rather than having individuals log in to the root account to perform everyday tasks, you should create __IAM users__ with specific privileges for them. IAM stands for _Identity and Access Management_, Amazon's service to manage identities in AWS.

Individuals will then receive credentials that correspond to their IAM user that can be used in the AWS CLI, SDK, or web console. When authenticated, the actions that can be successfully performed in these contexts correspond to the permissions that their IAM users have been granted.

Amazon suggests that the first step you take after registering the root account is to create an admin IAM user. This is just a standard IAM user that has administrative privileges delegated from the root account. From then on, you should lock away the root account credentials and use the admin IAM user to create and manage other IAM users, as well as handling billing and other administrative tasks.

Why do this? One important reason is that if your admin IAM user account becomes compromised, you can always use the root account to revoke all privileges from the IAM admin user. Conversely, if your root account is compromised, you're in trouble - the admin IAM user does not have control of the root account and cannot revoke its privileges. The root account being compromised would allow the attacker to strip all IAM users of their permissions.

There's some great reading on identities from AWS [here as well](https://docs.aws.amazon.com/IAM/latest/UserGuide/id.html).

## Using groups
You can attach permissions directly to a user, but it gets repetitive to add the same permissions to every new dev that joins the team.

Instead, you can create a group, attach permissions to the group, then add users to the group. So, let's create an `admins` group with administrative privileges, and later we'll add our first IAM user to this group in order to follow AWS's recommendation.

Navigate to the [IAM Dashboard](https://console.aws.amazon.com/iam/home) and you'll see the sidebar on the left.
<img src="/public/images/aws-iam-sidebar.png" alt="AWS IAM sidebar" style="width: 225px; display: block;">

Click on "Groups", and click on "Create New Group". You'll need to specify the group name, let's call this group __admins__.
<img src="/public/images/aws-admins.png" alt="Naming the AWS group" style="width: 300px; display: block;">

When you click "next", you'll be presented with a list of policies that you can attach to the group. You can get as precise as you want, but you can only attach a maximum of 10 policies. Most services, like Alexa and EC2, have available permissions suffixed with "FullAccess" that bundle all of their permissions into one.

Let's attach the "AdministratorAccess" policy.
<img src="/public/images/aws-group-admin-policy.png" alt="Adding admin policy to group" style="width: 500px; display: block;">

Click "Next step" to proceed to the review page, and confirm the creation of the group. You'll be returned to the groups overview page, and you'll see the new "admins" group listed with no users in it.

Now that we have an admins group, let's create an IAM user that can join the group and inherit its permissions.


## Creating an admin IAM user
To create the admin IAM user, go to the "Users" section of the IAM console, then click "Add User".

Let's give this user the username "admin", and enable both types of access: _programmatic_ and _management console_. Programmatic access allows this user to authenticate through the AWS CLI and API. Management console access allows this user to log in to the AWS web console.

<img src="/public/images/aws-iam-user-admin.png" alt="Creating admin IAM user" style="width: 500px; display: block;">

Proceed to the next page, and you'll have the option to add this user to any existing group. Let's add them to the __admins__ group.

<img src="/public/images/aws-iam-user-admin-group.png" alt="Adding admin IAM user to admins group" style="width: 500px; display: block;">

The next page offers the ability to add key-value "tags" to the IAM user, but we can skip this for now. Continue through the review step and you'll see a confirmation page with the user's access key ID, secret access key, and autogenerated password. The access key ID and secret access key are used for authenticating within the context of development tools. For now, just copy the password, as we're about to log out of the root account and pick back up as the admin IAM user.

## Logging in as the admin IAM user
IAM users are namespaced by the root account they belong to, meaning the IAM user's username is unique only within the context of the root account. So, when you log in as your new IAM user, you'll also need to know the root account's ID. For each root account, there is a login page for its IAM users that exists at a URL like:

__https://\<ACCOUNT_ID\>.signin.aws.amazon.com/console__
{: .center}

If you navigate back to the IAM dashboard (still as the root user), you'll see a link like that that IAM users can use to sign in. Alternatively, you can also find the root account ID from the "My Account" link in the user drop down on the right side of the toolbar at the top of the page.

<img src="/public/images/aws-iam-sign-in.png" alt="Signing in as the admin IAM user" style="width: 300px; display: block;">

I'll wrap up this tutorial now, but now that we're signed in as the admin IAM user, you can:

- Create IAM users for developers
- Add a group for developers
- Specify permissions for the developers group

## Configuring the AWS CLI

You can perform AWS actions from the shell. You'll first need to authenticate as an IAM user. [The AWS docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) provide an example of how to configure the CLI, summarized here.

You can install the AWS CLI using pip:

```pip install awscli```

You should then authenticate by running:

```aws configure```

The CLI will prompt you as such, where you should substitute the access keys of your IAM user who belongs to the `developers` group. If you don't know the user's access key ID or secret access key, you can navigate to their user page in the IAM console, click on the "Security Credentials" tab, and generate a new set of credentials. 

```bash
$ aws configure
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-west-2
Default output format [None]: json
```

If you check the contents of `~/.aws/credentials`, you'll see the default profile contains those credentials.
