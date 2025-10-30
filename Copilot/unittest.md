# Writing General Unit Test

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

Please refer to the `Accessing the Knowledge Base` section for more information about advanced features in unit test.
IMPORTANT: Unlike `TEST_FILE` which ends with `}`, `TEST_CASE` and `TEST_CATEGORY` ends with `});`.