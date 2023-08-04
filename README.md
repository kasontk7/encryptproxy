# Encryption Proxy Gateway

## Coding Challenge

You need to implement a way to transfer files that are end-to-end encrypted between an origin server and a frontend client:

- Use any language, framework, and packages of your choice
- totally open book - if you're stuck, feel free to search your way to a solution
- there is some basic starter code, but you can throw it all away if you'd like

### Part 1

We ask you to create a diagram of the architecture and choose the stack. We also ask you to implement what you've sketched out in the diagram, i.e. implement the solution end to end. Please attach it on the README with the information of the stack, and the reasoning behind it. Write down the logic and sketch the flow. We recommend that you use a service like Excalidraw (https://excalidraw.com/). That is, we are asking for the following:

- Diagram the architecture and agree on stack
- Implement:
  - API: Frontend ←→ Server M
  - API: Server M ←→ Server E

### Part 2

We ask you to supplement the solution by adding the option to send files end-to-end encrypted, as well as the process of key exchange between the Server E and Server M. That is, we are asking for the following:

- Frontend and backend for requests file from Server E via Server M
- Logic for key exchange between Server E and Server M

#### Crypto

```
IV_LENGTH <= 16 // For AES, this is always 16
clientKey <= vScyqmJKqGl73mJkuwm/zPBQk0wct9eQ5wPE8laGcWM=
encryptionKeyb64 <= base64(clientKey)
ecdhCurve <= createECDH("secp521r1");
pubKey = ecdhCurve.generateKeys();
secretKey = ecdhCurve.computeSecret(encryptionKeyb64);
encryptionKey = createHmac("sha256", "password")
.update(secretKey)
.digest();
iv <= randomBytes(IV_LENGTH);
cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
stream(file) -> cipher -> frontend
```

### Bonus

- Performance/memory optimizations
- Display status of the encryption process.

## Evaluation Rubric

- Completeness
  - Below Expectation: Basic functionality does not work, and/or has many bugs.
  - Meets Expectation: Implements the basic functionality without bugs.
  - Exceeds Expectation: Implements the basic functionality and at least one of the bonus challenges.
- Logic
  - Below Expectation: It is not encrypting end-to-end.
  - Meets Expectation: Encrypts and decrypts end-to-end.
  - Exceeds Expectation: Files are encrypted and decrypted correctly.
- Readability & Maintainability
  - Below Expectation: Inconsistent syntax. Poor function/variable names.
  - Meets Expectation: Used a linter. Easy to understand function/variable names.
  - Exceeds Expectation: Follows best practices. Modularized code. Comments explaining non-obvious trade-offs/future breakage. Has some test coverage for the happy path.

/frontend
├── /src
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── EncryptionStatus.tsx
│   ├── FileList.tsx
│   ├── FileTransferComponent.css
│   ├── FileTransferComponent.tsx
│   ├── FileUpload.tsx
│   ├── crypto.d.ts
│   ├── encryptionUtils.ts
│   ├── index.css
│   ├── index.tsx
│   ├── react-app-env.d.ts
│   ├── serviceWorker.ts
│   ├── setupTests.ts
│   └── useFileTransfer.tsx
/server-e
├── /uploads
├── database.db
├── server.js
/server-m
├── /uploads
├── /downloads
├── proxy.js
├── test.js
