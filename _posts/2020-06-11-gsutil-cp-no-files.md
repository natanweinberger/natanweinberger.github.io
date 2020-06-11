---
layout: post
title: "Copying empty directories with gsutil "
subtitle: ...
---

I have an Airflow job that copies the contents of a directory to a Google Cloud bucket every day. Some days, the directory is empty and the gsutil command throws an error:

```bash
> gsutil -m cp /tmp/*.json gs://my-bucket
CommandException: No URLs matched: /tmp/*.json
CommandException: 1 file/object could not be transferred.
```

This exits with a non-zero status code, which causes the Airflow job to be marked as failed. I want the Airflow job to be marked successful in this case, since this happens from time to time and is valid.

The solution is to add a check for the presence of any files, and provide an alternate command if the directory is empty:

```bash
> [ -f /tmp/*.json] && gsutil -m cp /tmp/*.json gs://my-bucket || echo 'No files to copy.'
No files to copy.
```
