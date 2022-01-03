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

You should set `INLINE_RUNTIME_CHUNK` environment variable to false, the script will not be embedded and will be imported as usual. More on `GENERATE_SOURCEMAP` later...

```properties
INLINE_RUNTIME_CHUNK=false
GENERATE_SOURCEMAP=false
```

### Install CSP Plugin

Install the dependencies including the [CSP Webpack Plugin](https://github.com/melloware/csp-webpack-plugin):

```shell
$ npm install react-app-rewired customize-cra @melloware/csp-webpack-plugin --save-dev
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
    'base-uri': "'self'",
    'connect-src': "'self'",
    'worker-src': "'self' blob:",
    'img-src': "'self' blob: data: content:",
    'font-src': "'self'",
    'frame-src': "'self'",
    'manifest-src': "'self'",
    'object-src': "'none'",
    'script-src': ["'self'"],
    'style-src': ["'self'"]
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
Execute `npm run build` to generate production build at you should be able to see these changes in production `index.html` file.
For each CSS and JS a nonce value is assigned and all in-line styles and scripts are blocked!

```xml
<meta http-equiv="Content-Security-Policy" 
     content="base-uri 'self'; object-src 'none'; 
     script-src 'self' 'nonce-hV1jy80qaffHEIfJ2wpryg=='; 
     style-src 'self' 'nonce-79pyUhldGFpDoALHNYfQzA==' 'nonce-BTVl+seb2fGInJbnPSfhVQ==' 'nonce-4kArpnz/wuhrQYZxqAJFqA=='; 
     default-src 'none'; 
     connect-src 'self'; 
     worker-src 'self' blob:; 
     img-src 'self' blob: data: content:; 
     font-src 'self'; 
     frame-src 'self'">

<link href="./assets/themes/lara-dark-indigo/theme.css" nonce="79pyUhldGFpDoALHNYfQzA==" rel="stylesheet">
```

### PrimeReact

[PrimeReact](https://www.primefaces.org/primereact/) is one of the most popular React UI libraries and it has special handling for 
responsive design components.  PrimeReact injects in-line CSS styles for some components such as the [Datatable](https://primefaces.org/primereact/datatable/responsive/) to 
handle the responsive features. In-line styles would be a CSP violation, but thanks to [CSP Webpack Plugin](https://github.com/melloware/csp-webpack-plugin) 
it has special handling to allow PrimeReact to use its dynamic in-line styles without violating CSP rules.

## Subresource Integrity

[Subresource Integrity](http://www.w3.org/TR/SRI/) (SRI) is a security feature that enables browsers to verify that files they fetch are delivered without unexpected manipulation.

By using the [CSP Webpack Plugin](https://github.com/melloware/csp-webpack-plugin) it automatically adds SHA384 integrity values to all CSS and JS.  This allows the
browser to verify that the script has not been tampered with and prevent ["man in the middle"](https://en.wikipedia.org/wiki/Man-in-the-middle_attack) attacks.  

When you view `index.html` of your production build you will see those values now have an `integrity` as well as a CSP `nonce` values:

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

Earlier in `.env` we set this property `GENERATE_SOURCEMAP=false`.  This issue is the **least** important compared to the others above and has been debated on how important it really is. 

> A _"source map"_ is a special file that connects a minified/uglified version of an asset (CSS or JavaScript) to the original authored version.

Create React App by default will generate source maps for your CSS and JS files. The main reason I prefer not to include source maps is _"Why make
hacker's life any easier by showing them your raw source code?"_.  Make a hacker go the extra mile and have to decode your uglified source code...for example:

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
