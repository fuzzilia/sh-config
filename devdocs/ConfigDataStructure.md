## Whole

| name                       | octet | type       | description                                 |
| -------------------------- | ----- | ---------- | ------------------------------------------- |
| format version             | 0-1   | Uint16     |                                             |
| keypad id                  | 2-3   | Uint16     |                                             |
| combination button numbers | 4-6   | Uint8 \* 3 |                                             |
| configs by combination     | 7-?   |            | block size \* (2 ^ combination button size) |

## Config By Combination Block

block size = variable

| name          | octet | type           | description                                                        |
| ------------- | ----- | -------------- | ------------------------------------------------------------------ |
| data type     | 0     | 1bit flag \* 2 | bit0:has button configs<br>bit1: has stick configs                 |
| button blocks | 1-?   |                | button block for each of the buttons.<br>empty if button flag is 0 |
| stick blocks  | ?     |                | stick block for each of the sticks.<br>empty if stick flag is 0    |

## Button Block

### Empty Button Block

block size = 1 octet

| name       | octet | bit | type                  | description                            |
| ---------- | ----- | --- | --------------------- | -------------------------------------- |
| block type | 0     | 0-4 | 4bit unsigned integer | 0 (fixed value)                        |
| skip count | 0     | 5-8 | 4bit unsigned integer | skip next "skip count" button settings |

### Standard Button Block

block size = 2 octets

| name         | octet | bit | type           | description                             |
| ------------ | ----- | --- | -------------- | --------------------------------------- |
| block type   | 0     | 0-3 | 4bit integer   | 1 (fixed value)                         |
| key modifier | 0     | 4-7 | 1bit flag \* 4 | 4: ctrl<br>5: shift<br>6: alt<br>7: gui |
| key code     | 1     |     | Uint8          |                                         |

### Gesture Button Block

block size = 1 + (3 \* active axis count) octets

| name                    | octet | bit | type                  | description                                |
| ----------------------- | ----- | --- | --------------------- | ------------------------------------------ |
| block type              | 0     | 0-3 | 4bit integer          | 2 (fixed value)                            |
| x is active             | 0     | 4   | 1bit flag             | omit x key config block if this value is 0 |
| y is active             | 0     | 5   | 1bit flag             | omit y key config block if this value is 0 |
| z is active             | 0     | 6   | 1bit flag             | omit z key config block if this value is 0 |
| unused                  | 0     | 7   |                       |                                            |
| x positive key modifier | 1     | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui    |
| x negative key modifier | 1     | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui    |
| x positive key code     | 2     |     | 8bit unsigned integer |                                            |
| x negative key code     | 3     |     | 8bit unsigned integer |                                            |
| y positive key modifier | 4     | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui    |
| y negative key modifier | 4     | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui    |
| y positive key code     | 5     |     | 8bit unsigned integer |                                            |
| y negative key code     | 6     |     | 8bit unsigned integer |                                            |
| z positive key modifier | 7     | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui    |
| z negative key modifier | 7     | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui    |
| z positive key code     | 8     |     | 8bit unsigned integer |                                            |
| z negative key code     | 9     |     | 8bit unsigned integer |                                            |

### Motion Rotate Button Block

block size = 4 + (3 \* active axis count) octets

| name                    | octet | bit | type                  | description                                |
| ----------------------- | ----- | --- | --------------------- | ------------------------------------------ |
| block type              | 0     | 0-3 | 4bit integer          | 3 (fixed value)                            |
| axis lock enabled       | 0     | 4   | 1bit flag             |                                            |
| unused                  | 0     | 5-7 |                       |                                            |
| x split size            | 1     |     | Uint8                 | omit x key config block if this value is 0 |
| y split size            | 2     |     | Uint8                 | omit y key config block if this value is 0 |
| z split size            | 3     |     | Uint8                 | omit z key config block if this value is 0 |
| x positive key modifier | 4     | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui    |
| x negative key modifier | 4     | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui    |
| x positive key code     | 5     |     | 8bit unsigned integer |                                            |
| x negative key code     | 6     |     | 8bit unsigned integer |                                            |
| y positive key modifier | 7     | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui    |
| y negative key modifier | 7     | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui    |
| y positive key code     | 8     |     | 8bit unsigned integer |                                            |
| y negative key code     | 9     |     | 8bit unsigned integer |                                            |
| z positive key modifier | 10    | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui    |
| z negative key modifier | 10    | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui    |
| z positive key code     | 11    |     | 8bit unsigned integer |                                            |
| z negative key code     | 12    |     | 8bit unsigned integer |                                            |

## Stick Block

### Empty Stick Block

| name       | octet | bit | type         | description     |
| ---------- | ----- | --- | ------------ | --------------- |
| block type | 0     | 0-3 | 4bit integer | 0 (fixed value) |
| unused     | 0     | 4-7 |              |                 |

### Rotate Stick Block

block size = 4

| name                       | octet | bit | type                  | description                             |
| -------------------------- | ----- | --- | --------------------- | --------------------------------------- |
| block type                 | 0     | 0-3 | 4bit unsigned integer | 1 (fixed value)                         |
| split number               | 0     | 4-7 | 4bit unsigned integer |                                         |
| clockwise key modifier     | 1     | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui |
| anticlockwise key modifier | 1     | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui |
| clockwise key code         | 2     |     | 8bit unsigned integer |                                         |
| anticlockwise key code     | 3     |     | 8bit unsigned integer |                                         |

### 4Button Stick Block

block size = 7 octets

| name               | octet | bit | type                  | description                             |
| ------------------ | ----- | --- | --------------------- | --------------------------------------- |
| block type         | 0     | 0-3 | 4bit unsigned integer | 2 (fixed value)                         |
| unused             | 0     | 4-7 |                       |                                         |
| up key modifier    | 1     | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui |
| right key modifier | 1     | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui |
| down key modifier  | 2     | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui |
| left key modifier  | 2     | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui |
| up key code        | 3     |     | 8bit unsigned integer |                                         |
| right key code     | 4     |     | 8bit unsigned integer |                                         |
| down key code      | 5     |     | 8bit unsigned integer |                                         |
| left key code      | 6     |     | 8bit unsigned integer |                                         |

### 8Button Stick Block

block size = 13 octets

| name                    | octet | bit | type                  | description                             |
| ----------------------- | ----- | --- | --------------------- | --------------------------------------- |
| block type              | 0     | 0-3 | 4bit integer          | 3 (fixed value)                         |
| unused                  | 0     | 4-7 |                       |                                         |
| up key modifier         | 1     | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui |
| up right key modifier   | 1     | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui |
| right key modifier      | 2     | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui |
| down right key modifier | 2     | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui |
| down key modifier       | 3     | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui |
| down left key modifier  | 3     | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui |
| left key modifier       | 4     | 0-3 | 1bit flag \* 4        | 0: ctrl<br>1: shift<br>2: alt<br>3: gui |
| up left key modifier    | 4     | 4-7 | 1bit flag \* 4        | 4: ctrl<br>5: shift<br>6: alt<br>7: gui |
| up key code             | 5     |     | 8bit unsigned integer |                                         |
| up right key code       | 6     |     | 8bit unsigned integer |                                         |
| right key code          | 7     |     | 8bit unsigned integer |                                         |
| down right key code     | 8     |     | 8bit unsigned integer |                                         |
| down key code           | 9     |     | 8bit unsigned integer |                                         |
| down left key code      | 10    |     | 8bit unsigned integer |                                         |
| left key code           | 11    |     | 8bit unsigned integer |                                         |
| up left key code        | 12    |     | 8bit unsigned integer |                                         |
