# Writing GacUI Unit Test

Here are some basic rules.

## Basic Structure

```C++
#include "TestControls.h"

using namespace gacui_unittest_template;

TEST_FILE
{
	const auto resourceTestSubject = LR"GacUISrc(
<Resource>
  <Instance name="MainWindowResource">
    <Instance ref.Class="gacuisrc_unittest::MainWindow">
      <Window ref.Name="self" Text="Test Subject" ClientSize="x:480 y:320">
        <!-- defines the UI here -->
      </Window>
    </Instance>
  </Instance>
</Resource>
)GacUISrc";

	TEST_CATEGORY(L"ClassNameUnderTest")
	{
		TEST_CASE(L"Topic")
		{
			GacUIUnitTest_SetGuiMainProxy([](UnitTestRemoteProtocol* protocol, IUnitTestContext*)
			{
				protocol->OnNextIdleFrame(L"Ready", [=]()
				{
					// Click this button
				});
				protocol->OnNextIdleFrame(L"Clicked this button", [=]()
				{
					// Type that text
				});
				protocol->OnNextIdleFrame(L"Typed that text", [=]()
				{
					auto window = GetApplication()->GetMainWindow();
					window->Hide();
				});
			});
			GacUIUnitTest_StartFast_WithResourceAsText<darkskin::Theme>(
				WString::Unmanaged(L"Controls/Category/ClassNameUnderTest/Topic"),
				WString::Unmanaged(L"gacuisrc_unittest::MainWindow"),
				resourceTestSubject
			);
		});
	});
}
```

If multiple test cases are in the same file:
- There can be only one `TEST_FILE`.
- There can be multiple `TEST_CATEGORY` but usually just one.
- There can be multiple `TEST_CASE` in a `TEST_CATEGORY`.
- There name will also appear in the arguments to `GacUIUnitTest_StartFast_WithResourceAsText` unless directed.

In `GacUIUnitTest_SetGuiMainProxy`, there will be multiple `protocol->OnNextIdleFrame`.
Each call creates a frame, associating the name to the what the UI was before frame execution.

If there are shared variable that updates in any frame in one `TEST_CASE`, they must be organized like this:
- Shared variables should be only in `TEST_CASE`.
- Lambda captures should be exactly like this example, `[&]` for the proxy and `[&, protocol]` for the frame.

## Organizing Frames

After an UI test case is executed, the whole UI will be captured and logged to files per frames.
Each frame shows how the UI was before executing code inside a frame.
In order to make these log human-familiar, please follow these rules:
- Always name the first frame "Ready".
- Name other frames for what the previous frame does. This is demoed in the example, as "Clicked this button" is the name of the second frame, while clicking the button happens in the first frame.
- A frame should introduce UI changing. Otherwise the unit test will crash with a specific error.
- Keep the last frame only calling `window->Hide();` if possible. But if no meaningful UI change is introduced in the previous frame, it is OK to merge them.
- Do not introduce unnecessary UI change just to separate frames. UI change must be necessary and meaningful for the test case.

```C++
TEST_CASE(L"Topic")
{
  vint sharedVariable = 0;

	GacUIUnitTest_SetGuiMainProxy([&](UnitTestRemoteProtocol* protocol, IUnitTestContext*)
	{
		protocol->OnNextIdleFrame(L"Ready", [&, protocol]()
		{
			// Use sharedVariable
		});
	});
	GacUIUnitTest_StartFast_WithResourceAsText<darkskin::Theme>(
		WString::Unmanaged(L"Controls/Category/ClassNameUnderTest/Topic"),
		WString::Unmanaged(L"gacuisrc_unittest::MainWindow"),
		resourceTestSubject
	);
});
```

## Accessing objects defined in the XML

Obtain the main window using `GetApplication()->GetMainWindow();`.
Obtain any named control using `FindObjectByName<CLASS-NAME>(MAIN-WINDOW, L"name")`, the name reflects in the XML using `ref.Name` attribute.
Obtain any control with text using `FindControlByText<CLASS-NAME>(MAIN-WINDOW, L"text")`, the name reflects in the XML using `Text` attribute.
You should define a variable for any object obtained above.

## Performing IO Actions

All methods you can use defines in the `UnitTestRemoteProtocol_IOCommands` class in `Source\UnitTestUtilities\GuiUnitTestProtocol_IOCommands.h`.
Call the like `protocol->LClick();`, there are `KeyPress`, `_Key(Down(Repeat)?|Up)`, `MouseMove`, `[LMR]((DB)?Click`, `_[LMR](Down|Up|DBClick)`.
Mouse actions use the last cursor location. If you offer new location to these functions, it just like calling `MouseMove` followed by one that is not offered a new location.

Obtain the center of the location using `protocol->LocationOf(CONTROL)`. You should define a variable for a location.
There are 4 more arguments for the function: ratioX, ratioY, offsetX, offsetY. If they are not offered, they will be `0.5, 0.5, 0, 0`, which means the center of the control with no offset. ratioX is the horizontal position of the control, ratioY is vertical, offsetX and offsetY adds to them. So if you offer `1.0, 0.0, -2, 3` it means the top right corner but moving 2 pixels left and 3 pixels down.

You can perform mouse, keyboard, typing or any other user actions on the UI. 
Find examples by yourself for arguments.
