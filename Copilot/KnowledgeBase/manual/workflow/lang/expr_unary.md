# Unary Operators

## Type inferences

For **+**, **-** and **not**, the result has the same type as **VALUE**. **variant in VALUE** has type **object** and requires a statically variant operand.

## Definitions

### + VALUE

- For numbers, returns **VALUE**.
- It is not allowed on other types.

### - VALUE

- For signed integers, returns -1 * **VALUE**.
- For floating-point numbers, returns -1 * **VALUE**.
- It is not allowed on other types.

### variant in VALUE

Extracts the active payload from a [variant](../.././workflow/lang/variant.md) as **object**, evaluating **VALUE** once. It shares the right-associative unary precedence of **+**, **-**, **not** and **cast**. For example, **cast int variant in value** extracts the payload and then performs an ordinary object-to-integer cast. Nonvariant operands are compiler errors, even when an object contains a variant box provided by native C++ code. Extraction removes one layer only; it preserves the value held by an active **object** option.

### not VALUE

- For integers, returns the bit-wise reversed value of **VALUE**.
- For **bool**, switch **true** and **false**.
- It is not allowed on other types.

