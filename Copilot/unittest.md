# Writing Test Code

Test code uses my own unit test framework. Here are some basic rules.

## Basic Structure

```C++
using namespace vl;
using namespace vl::unittest;

TEST_FILE
{
	TEST_CASE(L"TOPIC-NAME")
	{
    TEST_ASSERT(EXPRESSION-TO-VERIFY);
	});

	TEST_CATEGORY(L"CATEGORY-NAME")
	{
		TEST_CASE(L"TOPIC-NAME")
		{
			TEST_ASSERT(EXPRESSION-TO-VERIFY);
		});
	});
}
```

There can be mulitple `TEST_CATEGORY`, `TEST_CATEGORY` can be nested inside another `TEST_CATEGORY`.
There can be mulitple `TEST_CASE` in `TEST_FILE` or `TEST_CATEGORY`, `TEST_CASE` cannot be nested inside another `TEST_CASE`.
`TEST_ASSERT` can only appear in `TEST_CASE`.
