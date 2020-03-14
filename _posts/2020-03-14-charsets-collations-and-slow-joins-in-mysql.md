---
layout: post
title: Charsets, collations, and slow joins in MySQL
subtitle: ...
published: true
---

## The problem

We have two tables, `table_a` and `table_b`. We join the rows of `table_a` to `table_b` on the field `b_id`.

This join executes quickly. In `table_a`, there's an index on `b_id`. In `table_b`, `b_id` is the primary key.

```mysql
> SELECT *
  FROM table_a
  JOIN table_b USING (b_id)
  LIMIT 10;

...
Time: 0.100s
```

We want to deploy an upgraded version of `table_a` called `table_a2`.

`table_a2` has the same columns as its predecessor, but comes from a different data source and has a few extra years of historical data. It, too, has an index on `b_id`. However, we find that joins to `table_b` are unbearably slow.

```mysql
> SELECT *
  FROM table_a2
  JOIN table_b USING (b_id)
  LIMIT 10;

...
Time: 10.000s
```

## Diagnosing the issue

Let's try to generate some leads. The join is slow, so we'll run the `EXPLAIN` command on both queries to see if there are any clear differences.

#### The fast query
```mysql
> EXPLAIN SELECT *
  FROM table_a
  JOIN table_b USING (b_id)
  LIMIT 10;
+----+---------+----------------+---------+------+----------+-------------+
| id | table   | possible_keys  | key     | rows | filtered | Extra       |
+----+--------------------------+---------+------+----------+-------------+
| 1  | table_a | PRIMARY,b_id   | PRIMARY | 304  | 100.0    | Using where |
| 1  | table_b | PRIMARY        | PRIMARY | 1    | 100.0    | <null>      |
+----+---------+----------------+---------+------+----------+-------------+
```

#### The slow query
```mysql
> EXPLAIN SELECT *
  FROM table_a2
  JOIN table_b USING (b_id)
  LIMIT 10;
+----+----------+---------------+--------+----------+----------+-----------------------+
| id | table    | possible_keys | key    | rows     | filtered | Extra                 |
+----+----------+---------------+--------+----------+----------+-----------------------+
| 1  | table_b  | <null>        | <null> | 19835453 | 100.0    | <null>                |
| 1  | table_a2 | b_id          | b_id   | 1        | 100.0    | Using index condition |
+----+----------+---------------+--------+----------+----------+-----------------------+
```

\*_The output of EXPLAIN is shortened here for brevity._

Findings:
- In the first query, only about 304 rows need to be scanned
- In the second query, about 19 million rows need to be scanned
- The second query doesn't identify any usable keys in `table_b`

That massive number explains why the second query takes so long. However, it doesn't explain why MySQL needs to scan so many rows in the first place. It should be using the index just as it does in the first query.

Why is the second query scanning all the rows of `table_b` instead of using the index?

## Following leads

We know the join executes as expected with `table_a`, but it has a problem with `table_a2`. That indicates that the problem is likely independent of `table_b` itself, and we should focus on the differences between `table_a` and `table_a2`.

The indexes on both `table_a` and `table_a2` are the same, so my hunch is that the problem is at a level deeper than the index itself. That could mean that it's related to the engine that each table uses. The quickest way to take a peek is to see the command that would create each table.

```mysql
> SHOW CREATE TABLE table_a;
CREATE TABLE table_a (
...
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

```mysql
> SHOW CREATE TABLE table_a2;
CREATE TABLE table_a2 (
...
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
```

The engine is the same, but interestingly, the charset is different. That seems like as good a lead as any. Let's see what `table_b`'s charset is.

```mysql
> SHOW CREATE TABLE table_b
CREATE TABLE table_a2 (
...
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

It's the same as `table_a`'s, and those two tables coincidentally have no problem using the index in joins.

To recap:
- `table_a` has charset `utf8`
- `table_a2` has charset `utf8mb4`
- `table_b` has charset `utf8`

## Applying the fix

Let's try changing one of the charsets so that `table_a2` and `table_b` are consistent with each other.

I'm going to choose changing `table_b` to `utf8mb4` - check out the section [Following up](#following-up) for why I didn't choose to change `table_a2` to `utf8` (hint: `utf8mb4` is more flexible at virtually no cost).
```mysql
> ALTER TABLE table_b CONVERT TO CHARACTER SET utf8mb4;
> SELECT *
  FROM table_a2
  JOIN table_b USING (b_id)
  LIMIT 10;
...
10 rows in set
Time: 0.140s
```

That was it! The new query is roughly as fast as the old query.

## Following up

What's the difference between the two charsets? When would we want to use one over the other?

The [MySQL docs](https://dev.mysql.com/doc/refman/5.7/en/charset-general.html) do a good job of summarizing charsets and collations in general. This [Stack Overflow answer](https://stackoverflow.com/a/30074553/804237) also helps to explain the practical differences in MySQL specifically.

In summary:
- A charset is a set of symbols and encodings
    - Example: we assign A=0, B=1, a=2, b=3
- A collation is a set of rules for comparing characters in the character set
    - Example: A < B because 0 < 1
- In MySQL, both `utf8` and `utf8mb4` are charsets that use UTF-8 encoding
    - UTF-8 can represent all Unicode characters in four bytes or fewer
- The `utf8` charset is limited to the subset of symbols that are represented by three bytes or fewer
    - All symbols under three bytes are part of the UTF-8 Basic Multilingual Plane
- The `utf8mb4` charset can store all UTF-8 symbols (up to four bytes)
    - This includes four-byte characters beyond the Basic Multilingual Plane (emojis, some mathematical symbols)

So, `utf8mb4` is the same as `utf8` with the added capability of being able to store four-byte UTF-8 encoded chararcters. It doesn't cost anything extra to store characters under four bytes.

## More reading

[MySQL 5.7: Charsets](https://dev.mysql.com/doc/refman/5.7/en/charset-mysql.html)

[MySQL 5.7: Explain Output](https://dev.mysql.com/doc/refman/5.7/en/explain-output.html)
