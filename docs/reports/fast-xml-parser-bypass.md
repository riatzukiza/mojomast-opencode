# Security Report: fast-xml-parser Entity Encoding Bypass

### Summary

The `fast-xml-parser` library contains a critical vulnerability where an entity encoding bypass via regex injection in DOCTYPE entity names can lead to Cross-Site Scripting (XSS) or data injection (GHSA-m7jm-9gc2-mpf2). The project pulls in vulnerable versions of `fast-xml-parser` transitively via various `@aws-sdk` and `@azure` storage packages.

### Details

Versions of `fast-xml-parser` prior to `4.5.4` and `5.3.5` incorrectly process DOCTYPE entity names. When parsing XML, the library creates a regular expression from the entity name without escaping regex metacharacters, specifically the dot (`.`).

An attacker can provide an XML document with a DOCTYPE defining an entity like `<!ENTITY l. "malicious payload">`. Because the `.` matches any character, the resulting regex `/\&l.;/g` will match and replace standard encoded entities like `&lt;` before they are naturally decoded. This completely bypasses standard XML entity encoding, allowing an attacker to inject arbitrary unescaped content (like HTML tags `<img onerror=alert(1)>` or SQL injection payloads) into the parsed output.

In this repository, `fast-xml-parser` is not a direct dependency. However, `bun why fast-xml-parser` reveals it is deeply embedded as a transitive dependency required by AWS and Azure SDKs used across the workspace (e.g., `@aws-sdk/client-s3`, `@aws-sdk/client-sso`, `@aws-sdk/credential-providers`, and `@azure/storage-blob`).

### PoC

Because `fast-xml-parser` is utilized internally by the AWS and Azure SDKs to parse XML responses from cloud provider APIs (like S3 bucket listings or STS token responses), exploiting this directly from the outside is highly complex.

To reproduce the vulnerability in isolation:

1. Initialize the vulnerable parser (`const { XMLParser } = require("fast-xml-parser");`)
2. Parse a crafted XML string:

```javascript
const xml = `<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY l. "<script>alert('XSS')</script>">
]>
<root>
  <text>Hello &lt;b&gt;World&lt;/b&gt;</text>
</root>`

const result = new XMLParser().parse(xml)
console.log(result.root.text)
// Output: Hello <script>alert('XSS')</script>b>World<script>alert('XSS')</script>/b>
```

3. Observe that the encoded `&lt;` was shadowed and replaced by the malicious payload.

### Impact

**Type:** Entity Encoding Bypass leading to potential XSS or Injection.
**CVSS:** 9.3 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:L/I:H/A:N)
**CWE:** CWE-185 (Incorrect Regular Expression)

**Who is impacted:** Any application processing attacker-controlled XML with `fast-xml-parser`.
**Practical Risk for this Project:** **Low**. The library is invoked by AWS/Azure SDKs to parse HTTP responses from trusted cloud APIs (e.g., AWS S3). Unless an attacker can perform a Man-in-the-Middle (MitM) attack against the server's outbound requests to AWS, or trick the server into treating a malicious third-party endpoint as an S3 bucket, they cannot supply the crafted XML needed to trigger the bypass.

**Remediation:** Update the transitive dependencies. Running `bun update` should resolve newer versions of the `@aws-sdk` and `@azure` packages that depend on patched versions of `fast-xml-parser` (>= 4.5.4 or >= 5.3.5).
