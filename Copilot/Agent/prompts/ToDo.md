# TODO

## Optimization for pushLiveResponse
- For any response that had not been read by **ANY** token:
  - Search from the end backward to merge `on(Reasoning|Message)`.
  - Continue to search until:
    - Reached the earliest reading position of the token:
      - Merge all prior onX until finding onStartX.
    - Reached onStartX: skip
- Most of the time there will be:
  - consecutive responses of one message block generated
  - at most 2 incomplete message blocks exist
  - all tokens at the same position
  - so the algorithm should be optimal enough.