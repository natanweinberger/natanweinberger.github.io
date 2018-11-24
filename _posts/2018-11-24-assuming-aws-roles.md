---
layout: post
title: Intro to AWS and Assuming AWS Roles
subtitle: ...
---


This article outlines the steps to assuming an AWS role from start-to-finish, covering all the relevant background info about AWS as well.


The first step of the process is to sign up for an AWS developer account. You'll enter the usual sign up information, as well as billing information, but you won't be charged for anything that follows.

### AWS Background
Once I got started, I realized my understanding of some key terms was not as solid as I thought. So, let's define a few of them.

__Root account__: This is the account that you just registered. You will generally have one root account for a team. It has full root privileges and should primarily be used for any service tasks that can only be done as the root user, such as changing your AWS support plan and [other specific tasks](https://docs.aws.amazon.com/general/latest/gr/aws_tasks-that-require-root.html).

__IAM user__: IAM stands for _Identity and Access Management_. A single root account can have many IAM users under its canopy, each with their own credentials. Each member of a team should have their own IAM user with specific permissions delegated to it, so no one needs to login into the root account to perform everyday tasks. Individuals don't sign up as IAM users - IAM users are created from the IAM console by either the root user or an IAM user that has administrative permissions. <a href="#iam-users">More on this below.</a>

__Resource__: Everything in AWS is a resource - IAM users, S3 buckets, EC2 instances, etc. Each resource is addressable by a string called an ARN. Users need permissions to read, write, or perform any other action on a resource.

__Permission/policy__: AWS sometimes uses _permission_ and _policy_ interchangeably - it would be proper to say that a permission is defined by a policy. A permission is the ability to perform an action on an AWS resource. Permissions can be assigned both to users and to groups.

Most policies that you create will be _managed policies_, you can create them from the Policies tab on the sidebar of the IAM console. These can be attached reusably to multiple IAM users and groups. The alternative is to define an _inline policy_ for a user or group. You apply it directly to a user or group, and it will not appear for re-use for other users or groups elsewhere.

__Group__: AWS simplifies the process of adding the same permissions for many users by allowing you to create groups. Rather than attaching permissions to users directly, you apply them to the group. In a pinch, you can still add additional permissions to an individual IAM user directly, perhaps for a developer who needs temporary access to a specific resource.

__Role__: Like a pseudo-user, a role has certain policies attached to it and can be assumed by any approved real user at any time. The real user will get back a dynamically-generated, temporary set of credentials that allow them to assume the role's policies. The real user will need permission to assume a role. [More from the AWS docs](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html).


### Root account vs. IAM users
<a class="anchor" id="iam-users"></a>

The account you've created is referred to as the __root account__. Rather than using the root account for everyday tasks, you should create __IAM users__ with specific privileges.

Amazon suggests that the first step you take after registering the root account is to create an IAM user with admin capabilities. This is just a standard IAM user that has any administrative privileges delegated from the root account. From then on, you should use the admin IAM user to create and manage other IAM users, as well as handling billing and other administrative tasks.

Why do this? One important reason is that if your admin IAM user account becomes compromised, you can always use the root account to revoke all privileges from the IAM admin user. Conversely, if your root account is compromised, you're in trouble - the admin IAM user does not have control of the root account and cannot revoke its privileges. The root account being compromised allows the attacker to strip all IAM users of their permissions.

### Using groups
The preferred way to assign permissions is to create a group, attach permissions to the group, then add IAM users to the group. So, let's create an `admins` group with administrative privileges, and later we'll add our first IAM user to this group.

Navigate to the [IAM Dashboard](https://console.aws.amazon.com/iam/home) and you'll see the sidebar on the left.
<img src="/public/images/aws-iam-sidebar.png" alt="AWS IAM sidebar" style="width: 225px; display: block;">

Click on "Groups", and click on "Create New Group". You'll need to specify the group name, let's call this group __admins__.
<img src="/public/images/aws-admins.png" alt="Naming the AWS group" style="width: 300px; display: block;">

When you click "next", you'll be presented with a list of policies that you can attach to the group. You can get as precise as you want, but since you can only attach a maximum of 10 policies, there are policies provided that essentially bundle full access of a resource type, like Alexa or EC2, into a single policy called "FullAccess".

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

The next page offers the ability to add key-value "tags" to the IAM user, but we don't need them. Continue through the review step and you'll see a confirmation page with the user's access key ID, secret access key, and autogenerated password. The access key ID and secret access key are used for authenticating within the context of development tools. For now, just copy the password, as we're about to log out of the root account and pick back up as the admin IAM user.

IAM users are namespaced by the root account they belong to, meaning the IAM user's username is unique only within the context of the root account. So, when you log in as your new IAM user, you'll also need to know the root account's ID. For each root account, there is a login page for its IAM users that exists at a URL like:

__https://\<ACCOUNT_ID\>.signin.aws.amazon.com/console__
{: .center}

If you navigate back to the IAM dashboard (still as the root user), you'll see a link like that that IAM users can use to sign in. Alternatively, you can also find the root account ID from the "My Account" link in the user drop down on the right side of the toolbar at the top of the page.

<img src="/public/images/aws-iam-sign-in.png" alt="Signing in as the admin IAM user" style="width: 300px; display: block;">

Now that we're signed in as the admin IAM user, we can use this account to:

- Define a managed policy based on the provided role
- Create a group to use that policy
- Add a non-admin IAM user to belong to that group

### Creating a group to assume the role

The third party has provided us with a policy that allows us to assume a role.

The policy looks like this:
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

Although this was provided to us by the other party, we can acknowledge that the value for `Resource` adheres to [AWS's ARN formatting](https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html).
```
arn:partition:service:region:account-id:resourcetype/resource
```

In this case:
- the `partition` is "aws"
- the `service` is "iam"
- there is no `region` specified
- the `account ID` is for the account that owns the resource
- the `resource type` is "role"
- the `resource` is "MyApp/MyS3Access", simply an arbitrary name for this role

Let's take this policy definition and create a new managed policy.

Go to the IAM dashboard and click on the "Policies" tab. Click "Create policy" at the top of the screen, switch to the tab that says "JSON", and paste in the policy.

<img src="/public/images/aws-policy.png" alt="Adding the managed policy" style="width: 500px; display: block;">

Proceed to "Review policy", and give the policy a descriptive name.

<img src="/public/images/aws-policy-review.png" alt="Adding the managed policy" style="width: 600px; display: block;">

Great! We're almost done. Let's go back to the "Groups" page and create a group called `developers` to which we'll attach the policy.

<img src="/public/images/aws-group-developers.png" alt="Adding the developers group" style="width: 500px; display: block;">

Before finalizing the group, we're presented with available policies to attach to it. Let's filter by __Customer Managed policies__.

<img src="/public/images/aws-policy-filter.png" alt="Filtering for managed policies" style="width: 600px; display: block;">

And our new policy appears!

<img src="/public/images/aws-policy-filter-2.png" alt="Viewing the managed policies" style="width: 600px; display: block;">

Let's attach that policy and go to the next step to finish creating the group.

You'll be dropped back at the groups listing, where you'll find the two groups we've created.

<img src="/public/images/aws-groups-list.png" alt="Viewing groups" style="width: 600px; display: block;">

Now, let's add an IAM user who will belong to this group. I'll call this user `natan` and I'll use it for day-to-day development purposes. After setting the username, you'll have the option to add the user to group. Let's add this user to the `developers` group.

<img src="/public/images/aws-add-user-to-group.png" alt="Adding the new user to the developer's group" style="width: 600px; display: block;">


Once the user is created, you should see from their user page that they belong to one group, `developers`, and that they have the `MyAppS3Access` permission attached.

### Configuring the AWS CLI

[The AWS docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) provide an example of how to configure the CLI, summarized here.

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

### Assuming the role

Now that we're authenticated in the CLI, we can assume the role. The command to assume a role looks like this:

```
aws sts assume-role --role-arn "arn:aws:iam::<ACCOUNT_ID>:role/..." --role-session-name "FirstSession" --external-id "<external-id>" 
```

The `--external-id` flag is optional, but may be required according to the other party's policy definition. If they didn't specify one to you, you can drop it.

You'll receive a response from AWS that contains credentials, including an access key ID, a secret access key, a session token, and an expiration timestamp.

The easiest way to use these is to add a new profile to your `~/.aws/credentials` with these values. Simply append a new profile after the default one, making sure to include the session key. Note that once these credentials expire, you'll need to request new credentials and update the profile.

```
[default]
aws_access_key_id = <DEFAULT_ACCESS_KEY_ID>
aws_secret_access_key = <DEFAULT_SECRET_ACCESS_KEY>

[my-role]
aws_access_key_id = <ACCESS_KEY_ID>
aws_secret_access_key = <SECRET_ACCESS_KEY>
aws_session_token = <SESSION_TOKEN>
```

You can then run any valid AWS command that role allows you to, as long as you specify the temporary profile.

```
aws s3 ls s3://path/to/bucket/ --profile my-role
```

### References:

[https://docs.aws.amazon.com/AmazonS3/latest/dev/example-walkthroughs-managing-access-example2.html#access-policies-walkthrough-cross-account-permissions-acctB-tasks](https://docs.aws.amazon.com/AmazonS3/latest/dev/example-walkthroughs-managing-access-example2.html#access-policies-walkthrough-cross-account-permissions-acctB-tasks)

[https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)

[https://docs.aws.amazon.com/AmazonS3/latest/dev/policy-eval-walkthrough-download-awscli.html](https://docs.aws.amazon.com/AmazonS3/latest/dev/policy-eval-walkthrough-download-awscli.html)
