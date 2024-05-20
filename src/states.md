```typescript
// const AccessCodeState = {
//     NOT_CHECKED: 'not checked',
//     CHECKING_FROM_COOKIES: 'checking from cookies',
//     CHECKING_FROM_URL: 'checking from url',
//     CHECKING_FROM_SEND_BTN: 'checking from send button',
//     EMPTY: 'empty',
//     VALID: 'valid',
//     INVALID: 'invalid'
// }

// const JwtState = {
//     NOT_CHECKED: 'not checked',
//     CHECKING: 'checking',
//     EMPTY: 'empty',
//     VALID: 'valid',
//     INVALID: 'invalid'
// }
```

| AccessCodeState | JwtState | HTML | Action |
|-----------------|----------|------|--------|
| NOT_CHECKED | NOT_CHECKED | vide | send check access code + jwt, accessCodeState = CHECKING/EMPTY, jwtState = CHECKING/EMPTY |
| NOT_CHECKED | CHECKING | / | / |
| NOT_CHECKED | EMPTY | / | / |
| NOT_CHECKED | VALID | / | / |
| NOT_CHECKED | INVALID | / | / |
| CHECKING_FROM_COOKIES | NOT_CHECKED | / | / |
| CHECKING_FROM_COOKIES | CHECKING | in progress | No |
| CHECKING_FROM_COOKIES | EMPTY | in progress | No |
| CHECKING_FROM_COOKIES | VALID | show tickets (disconnect) | save access code from response, accessCodeState = VALID, save cookies|
| CHECKING_FROM_COOKIES | INVALID | in progress | No |
| CHECKING_FROM_URL | NOT_CHECKED | / | / |
| CHECKING_FROM_URL | CHECKING | in progress | No |
| CHECKING_FROM_URL | EMPTY | in progress | No |
| CHECKING_FROM_URL | VALID | show tickets (disconnect) | save access code from response, accessCodeState = VALID, save cookies|
| CHECKING_FROM_URL | INVALID | in progress | No |
| CHECKING_FROM_SEND_BTN | NOT_CHECKED | / | / |
| CHECKING_FROM_SEND_BTN | CHECKING | / | / |
| CHECKING_FROM_SEND_BTN | EMPTY | in progress | No |
| CHECKING_FROM_SEND_BTN | VALID | / | / |
| CHECKING_FROM_SEND_BTN | INVALID | in progress | No |
| EMPTY | NOT_CHECKED | / | / |
| EMPTY | CHECKING | in progress | No |
| EMPTY | EMPTY | enter access code | No |
| EMPTY | VALID | show tickets (disconnect) | save access code from response, accessCodeState = VALID, save cookies|
| EMPTY | INVALID | enter access code | No |
| VALID | NOT_CHECKED | / | / |
| VALID | CHECKING | show tickets (connecting) | No |
| VALID | EMPTY |  show tickets (connect) | No |
| VALID | VALID | show tickets (disconnect) | No |
| VALID | INVALID | show tickets (connect) | No |
| INVALID | NOT_CHECKED | / | / |
| INVALID | CHECKING | / | / |
| INVALID | EMPTY | enter access code | No |
| INVALID | VALID | show tickets (disconnect) | save access code from response, accessCodeState = VALID, save cookies|
| INVALID | INVALID | enter access code | No |