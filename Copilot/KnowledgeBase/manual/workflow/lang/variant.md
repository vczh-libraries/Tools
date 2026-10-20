# Variants

**variant\<A, B, ...\>** is a value type that stores one declared option and its value. It maps to **vl::Variant** in generated C++. The active option is preserved when the value is copied, passed through reflection, or stored in a typed collection.

## Type identity and valid options

A variant requires at least two valid value types. Options are ordered: **variant\<int, string\>** and **variant\<string, int\>** are different Workflow types. Resolved aliases refer to the same option, so **string** and **system::String** cannot both appear. The target architecture determines what **int** and **uint** mean.

An option cannot be **void** or itself be a variant. A variant itself cannot have a pointer or optional decoration. Collections of variant elements are supported.

Options must also produce distinct native C++ alternatives. For example, **int[]** and **string[]** both map to **Ptr\<IValueList\>**, so they cannot be two options in one variant. This restriction does not make those two list types equal elsewhere in Workflow. Function signatures in **Func** and enumerable element types in **LazyList** remain distinct native types.

A native untyped collection option retains its declared metadata. Reflection does not inspect a **Ptr\<IValueList\>** payload to turn it into an exact **int[]** option.

## Construction, assignment and conversion

Assignment, arguments and returns require the same ordered variant type. There is no implicit conversion between a variant and its options, between different variants, or from a variant to **object**. Use an explicit **cast** or **of** expression:
```
var number = cast variant<int, string> 42;
var text = "hello" of variant<int, string>;
var reordered = cast variant<string, int> number;
var widened = text of variant<double, string, int>;
```
 The active values are respectively **42**, **"hello"**, **42** and **"hello"**.

- **cast VARIANT value** and **value of VARIANT** select the exact declared type of a nonvariant value. Numeric, inheritance, pointer-ownership and optional conversions do not make an option match.
- **cast OPTION value** requires that exact option to be declared. It throws when a different option is active.
- **cast TARGET_VARIANT value** requires a nonempty intersection of option types. It throws when the active option is outside that intersection.
- **value of TARGET_VARIANT** requires every source option to occur in the target. It preserves the active option and permits reordering.

For the example above, **cast string number** is a runtime failure: **string** is declared, but **int** is active. A cast to an option that is not declared is a compiler error. Bare **null** and other expressions needing an expected type cannot choose an option implicitly; first give the payload an explicit type.

This declaration is rejected because a variant does not implicitly convert to **object**:
```
func f(x:variant<int, string>):void { var y:object = x; }
```

## Weak casts, null and defaults

**value as T*** or **value as T^** requires that exact pointer option. **value as T?** requires an option of **T** or **T?** and accepts either when active. A different active option returns **null**. Weak casts to a variant or to a nonnullable value type are unsupported.
```
var plain = cast variant<int, int?, string> 7;
var optional : int? = 8;
var present = optional of variant<int, int?, string>;
var empty : int? = null;
var missing = cast variant<int, int?, string> empty;
```
**plain as int?** returns 7, **present as int?** returns 8, and **missing as int?** returns null. Strong extraction remains exact: **cast int? plain** throws.

Null does not erase the active option. Strong extraction of a matching null pointer or empty optional succeeds; extraction of another declared option throws even when both payloads would be null. Likewise, a base-pointer option containing a derived object remains the base-pointer option.

**is null** and **is not null** require at least one null-bearing option and inspect the active payload. They do not test whether the outer variant box exists. A compiler-generated default, including an unassigned struct field, selects the first declared option and uses that option's default value. Thus a default **variant\<int, string\>** contains integer zero; a default **variant\<int?, string\>** contains an empty optional tagged as **int?**.

## The object option and explicit escape

An explicit **object** option takes precedence. Converting an object-typed value to such a variant selects that option without inspecting the payload. Casting that variant to **object** extracts only an active **object** option; another active option causes a runtime failure.

If **object** is not an option, **cast object value** preserves the complete outer variant box. A later ordinary cast does not extract its payload. This function compiles but fails when called:
```
func EscapedPayload():int
{
  var value = 1 of variant<int, string>;
  var escaped : object = cast object value;
  return cast int escaped;
}
```
 Casting an object-typed value back to a variant without an exact **object** option is rejected at compile time. There is no dynamic recovery cast.

## Comparison and other operations

The six comparison operators compare active payloads, including a variant and a nonvariant operand or two different variant types. They do not order by option position or require a common variant type.
```
var a = 3 of variant<int, string>;
var b = 3.0 of variant<double, bool>;
var text = "three" of variant<int, string>;
```
**a == b** and **a == 3.0** are true. **a != text** is true, while all four relational comparisons between **a** and **text** are false.

Comparison is a partial ordering. Unordered payloads, including NaN, produce false for **==** and all relational operators, and true for **!=**. Pointer payloads retain the existing pointer-identity semantics.

Extract an option before arithmetic, logical operations, indexing, invocation or member access. Type tests with **is TYPE** or **is not TYPE**, and variant type queries, are unsupported. Reading a variant-valued field or property is supported; extracting a value makes a copy, and writing back requires assigning a complete valid variant.

## Bindings and RPC

A [binding](../.././workflow/lang/bind.md) publishes through **ValueChanged(object)**. A direct variant result is therefore rejected. The authored expression must extract a payload or explicitly produce an allowed nonvariant result. Observing and caching a variant while producing such a result is supported.

[RPC](../.././workflow/rpc.md) does not support variants, including variants contained in collection arguments, optional wrappers or struct fields. Escaping a variant to **object** does not make it JSON serializable.

