# Security Hardening for Create-React-App (CRA)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/melloware/react-security-hardening/actions/workflows/build.yml/badge.svg)](https://github.com/melloware/react-security-hardening/actions/workflows/build.yml)

[Create React App (a.k.a CRA)](https://create-react-app.dev/) offered by Facebook is one of the most popular ways to bootstrap and build React applications.  CRA does an 
excellent job of shielding developers from the complexities of things such as Webpack, Babel, and ESLint.  When producing a production ready
build, CRA optimizes and minimizes your CSS and Javascript code to produce the smallest and most efficient bundle for deployment.  However,
too often developers are content with this build assuming Facebook has done all the hard work and this is the best build that can be made.
The question to ask yourself is: _"Can I do more to secure my application from hackers?"_.  This article is the result of my research and final decisions
on how to security harden my production applications.

This article will show you how to make your CRA application more secure for your organization by implementing:
- Content Security Policy (CSP)
- Trusted Types and Sanitizing HTML 
- Subresource Integrity (SRI)
- Excluding Source Maps

## Content Security Policy (CSP)

[Content Security Policy](https://developers.google.com/web/fundamentals/security/csp/) is your first line of defense against hackers and CSP Level 2 is supported in all modern browsers.
I won't go into detail on what CSP is but you can read more about that [here](https://developers.google.com/web/fundamentals/security/csp/).  

One of the most common forms of malware infections by hackers is known as [drive-by cryptojacking](https://www.malwarebytes.com/cryptojacking).  
_Similar to malicious advertising exploits, the scheme involves embedding a piece of JavaScript code into a web page. After that, it performs cryptocurrency mining on user machines that visit the page._
If you have the proper CSP configuration on your website it makes this type of malware impossible for hackers to inject in your website.  

To enable CSP in your React application do the following steps.

### Update .env

By default, Create React App will embed an in-line script into `index.html` during the production build.

> This is a small chunk of webpack runtime logic which is used to load and run the application. The contents of this will be embedded in your build/index.html file by default to save an additional network request.

Create/update the `.env` file in your project root directory and set `INLINE_RUNTIME_CHUNK` environment variable to false, the script will not be embedded and will be imported as usual. More on `GENERATE_SOURCEMAP` later...

```properties
INLINE_RUNTIME_CHUNK=false
GENERATE_SOURCEMAP=false
```

### Install CSP Plugin

Install the development dependencies including the [CSP Webpack Plugin](https://github.com/melloware/csp-webpack-plugin):

```shell
$ npm install react-app-rewired customize-cra @melloware/csp-webpack-plugin --save-dev
```

Install runtime dependencies for [DOMPurify](https://www.npmjs.com/package/dompurify) and [Trusted Types](https://www.npmjs.com/package/trusted-types):
```shell
$ npm install dompurify trusted-types
```

Update `package.json` to use [React App Rewired](https://github.com/timarney/react-app-rewired) so we can inject our Webpack build updates:

```json
"start": "react-app-rewired start",
"build": "react-app-rewired build",
"test": "react-app-rewired test"
```

Create `config-overrides.js` file in the project root directory next to `package.json`:

```javascript
const { override } = require('customize-cra');
const CspHtmlWebpackPlugin = require("@melloware/csp-webpack-plugin");

const cspConfigPolicy = {
    'default-src': "'none'",
    'object-src': "'none'",
    'base-uri': "'self'",
    'connect-src': "'self'",
    'worker-src': "'self'",
    'img-src': "'self' blob: data: content:",
    'font-src': "'self'",
    'frame-src': "'self'",
    'manifest-src': "'self'",
    'style-src': ["'self'"],
    'script-src': ["'strict-dynamic'"],
    'require-trusted-types-for': ["'script'"]
};

function addCspHtmlWebpackPlugin(config) {
    if (process.env.NODE_ENV === 'production') {
        config.plugins.push(new CspHtmlWebpackPlugin(cspConfigPolicy));
        config.output.crossOriginLoading = "anonymous";
    }
    return config;
}

module.exports = {
    webpack: override(addCspHtmlWebpackPlugin),
};
```

### Execute Build
Execute `npm run build` to generate a production build and you should be able to see these changes in production `index.html` file.
For each CSS and JS a nonce value is assigned and all in-line styles and scripts are blocked!

```xml
<meta http-equiv="Content-Security-Policy" 
      content="base-uri 'self'; 
      object-src 'none'; 
      script-src 'strict-dynamic' 'nonce-CrAICtit7djMzvPP/AOk1Q=='; 
      style-src 'self' 'nonce-hNq0/mMzZ+jWZOaWVGFguw==' 'nonce-5AlQofvVcR/v5P34fReEAw==' 'nonce-UzHYDLEeW68WnP3QweiB5A=='; 
      default-src 'none'; 
      connect-src 'self'; 
      worker-src 'self'; 
      img-src 'self' blob: data: content:; 
      font-src 'self'; 
      frame-src 'self'; 
      manifest-src 'self'; 
      require-trusted-types-for 'script'">

<link href="./assets/themes/lara-dark-indigo/theme.css" nonce="79pyUhldGFpDoALHNYfQzA==" rel="stylesheet">
```

### Validate Policy

You can validate your policy is CSP Level 2/3 compliant using the [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/).

![CSP Evaluator Results](https://github.com/melloware/react-security-hardening/raw/main/public/images/csp-evaluator.png)

### PrimeReact

[PrimeReact](https://www.primefaces.org/primereact/) is one of the most popular React UI libraries and it has special handling for 
responsive design components.  PrimeReact injects in-line CSS styles for some components such as the [Datatable](https://primefaces.org/primereact/datatable/responsive/) to 
handle the responsive features. In-line styles would be a CSP violation, but thanks to [CSP Webpack Plugin](https://github.com/melloware/csp-webpack-plugin) 
it has special handling to allow PrimeReact to use its dynamic in-line styles without violating CSP rules.

## Sanitizing HTML

Real-world applications often run into requirements where they need to render dynamic HTML code.
Assigning text-based code and data to `innerHTML` is a common mistake in JavaScript applications. This pattern is so dangerous that React does not expose `innerHTML` directly but encapsulates it in a property called [dangerouslySetInnerHTML](https://zhenyong.github.io/react/tips/dangerously-set-inner-html.html). 
Improper use of the innerHTML can open you up to a [cross-site scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) attack.

> Our design philosophy is that it should be "easy" to make things safe, and developers should explicitly state their intent when performing "unsafe" operations. The prop name dangerouslySetInnerHTML is intentionally chosen to be frightening.

**BAD (XSS attack):**

```typescript
const value = `<img src="nonexistent.png" onerror="alert('You have been hacked!');" />`;

return (<p dangerouslySetInnerHTML={{__html: value}}></p>);
```

The above would execute the script in the browser to show you how a simple XSS attack would work.  You should **ALWAYS** sanitize your HTML before sending to `innerHTML` using a library like [DOMPurify](https://www.npmjs.com/package/isomorphic-dompurify).

**GOOD:**

```typescript
// Import DOMPurify
import DOMPurify from 'isomorphic-dompurify';

// Sanitize the HTML
return (<p dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(value, {RETURN_TRUSTED_TYPE: true})}}></p>);
```

The code above would be sanitized and the `alert` script removed from the output.  However thanks to the CSP WebPack plugin [this code](https://github.com/melloware/csp-webpack-plugin#trusted-types) was automatically added so your entire codebase
is now sanitized anywhere `innerHTML` is being used.

## Subresource Integrity

[Subresource Integrity](http://www.w3.org/TR/SRI/) (SRI) is a security feature that enables browsers to verify that files they fetch are delivered without unexpected manipulation.

By using the [CSP Webpack Plugin](https://github.com/melloware/csp-webpack-plugin) it automatically adds SHA384 integrity values to all CSS and JS.  This allows the
browser to verify that the script has not been tampered with and prevent ["man in the middle"](https://en.wikipedia.org/wiki/Man-in-the-middle_attack) attacks.  

When you view `index.html` of your production build you will see those values now have an `integrity` attribute as well as a CSP `nonce` attribute:

```xml
<script src="./static/js/main.8bde7ba0.js" defer="defer" 
        integrity="sha384-JLO8GNxYumunJQcIEFyDRXqQvvj+slHlDz5RGWL3n2nQ3fZoxx8zj2UoUCmIc4LT" 
        crossorigin="anonymous" 
        nonce="hV1jy80qaffHEIfJ2wpryg==">

<link href="./static/css/main.dd01fb9f.css" rel="stylesheet" 
      integrity="sha384-GySwniTtj+pQHy5qOa6ngGbRtMRbiebMO3kb4v0o7cfMnhPQsJP/NHXA53WNz2i9" 
      crossorigin="anonymous" 
      nonce="BTVl+seb2fGInJbnPSfhVQ==">
```

## Source Maps

> A _"source map"_ is a special file that connects a minified/uglified version of an asset (CSS or JavaScript) to the original authored version.

Create React App by default will generate source maps for your CSS and JS files.  Attackers will most often try to understand your code to hack their way through. Therefore, having a readable source code in the production build increases the attack surface.

Make a hacker go the extra mile and have to decode your uglified source code by adding `GENERATE_SOURCEMAP=false` to the `.env` file.

**Uglified:**
```javascript
function a(b, c){return b*c/c};
```

**Source Map:**
```javascript
function calculateFinancials (amount: double, total: double) {
   return amount * total / total;
}
```

This is a simple example...but what if your code was quite complex?  It would be much more difficult for a hacker to figure out what your code is doing.

The second and smaller benefit is that not including source maps makes your production build faster.  The note inside the Create React App source code says this:

```javascript
// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
```

## Conclusion

In conclusion, you can choose to use any of these tips or pick and choose which tips to use.  I personally prefer to use all of them in my production applications. 
If anyone has any more security hardening tips I would be happy to update this article and keep it updated.  All of the source code used in this article is available
on GitHub here: [https://github.com/melloware/react-security-hardening](https://github.com/melloware/react-security-hardening)

You can run `npm run start` and navigate to http://localhost:3000 to see this all in action!
